using RoVia.API.Data;
using RoVia.API.DTOs;
using RoVia.API.Models;
using Microsoft.EntityFrameworkCore;

namespace RoVia.API.Services;

public class QuizService
{
    private readonly AppDbContext _context;

    public QuizService(AppDbContext context)
    {
        _context = context;
    }

    private static Question BuildQuestionEntity(QuizQuestionRequest request, int order)
    {
        var question = new Question
        {
            Text = request.Text,
            PointsValue = request.PointsValue,
            Order = order,
            CreatedAt = DateTime.UtcNow
        };

        int answerOrder = 1;
        foreach (var answer in request.Answers)
        {
            question.Answers.Add(new Answer
            {
                Text = answer.Text,
                IsCorrect = answer.IsCorrect,
                Order = answer.Order == 0 ? answerOrder : answer.Order
            });
            answerOrder++;
        }

        if (!question.Answers.Any(a => a.IsCorrect))
        {
            // mark first answer as correct to avoid invalid quiz; caller validation should prevent this
            question.Answers.First().IsCorrect = true;
        }

        return question;
    }

    public async Task<List<Quiz>> GetQuizzesByAttractionAsync(int attractionId)
    {
        return await _context.Quizzes
            .Where(q => q.AttractionId == attractionId)
            .Include(q => q.Questions)
            .ThenInclude(q => q.Answers)
            .ToListAsync();
    }

    public async Task<Quiz> GetQuizWithQuestionsAsync(int quizId)
    {
        return await _context.Quizzes
            .Where(q => q.Id == quizId)
            .Include(q => q.Questions)
            .ThenInclude(q => q.Answers)
            .FirstOrDefaultAsync();
    }

    public async Task<QuizSubmissionResult?> SubmitQuizAsync(int userId, int quizId, Dictionary<int, int> answers)
    {
        var quiz = await GetQuizWithQuestionsAsync(quizId);
        if (quiz == null) return null;
        if (answers == null || answers.Count == 0) return null;

        var questions = quiz.Questions ?? new List<Question>();
        var questionPoolSize = questions.Count;
        var answeredQuestions = questions
            .Where(q => answers.ContainsKey(q.Id))
            .ToList();

        if (!answeredQuestions.Any()) return null;

        int correctCount = 0;
        int earnedBasePoints = 0;
        int potentialBasePoints = answeredQuestions.Sum(q => q.PointsValue);

        foreach (var question in answeredQuestions)
        {
            if (answers.TryGetValue(question.Id, out int selectedAnswerId))
            {
                var selectedAnswer = question.Answers.FirstOrDefault(a => a.Id == selectedAnswerId);
                if (selectedAnswer?.IsCorrect == true)
                {
                    correctCount++;
                    earnedBasePoints += question.PointsValue;
                }
            }
        }

        // Calcul final cu bonus pentru dificultate
        int multiplier = Math.Max(1, quiz.DifficultyLevel);
        int finalPoints = earnedBasePoints * multiplier;
        int maxPoints = potentialBasePoints * multiplier;

        // Salvare progres
        var userProgress = new UserProgress
        {
            UserId = userId,
            QuizId = quizId,
            PointsEarned = finalPoints,
            CorrectAnswers = correctCount,
            TotalQuestions = answeredQuestions.Count,
            IsCompleted = true,
            CompletedAt = DateTime.UtcNow,
            TimeSpentSeconds = 0
        };

        _context.UserProgresses.Add(userProgress);

        // Update total points ale utilizatorului
        var user = await _context.Users.FindAsync(userId);
        if (user != null)
        {
            user.TotalPoints += finalPoints;
            _context.Users.Update(user);
        }

        await _context.SaveChangesAsync();

        return new QuizSubmissionResult
        {
            PointsEarned = finalPoints,
            BasePoints = earnedBasePoints,
            DifficultyMultiplier = multiplier,
            MaxPoints = maxPoints,
            CorrectAnswers = correctCount,
            TotalQuestions = answeredQuestions.Count,
            QuestionPoolSize = questionPoolSize
        };
    }

    public async Task<Quiz?> CreateQuizAsync(int userId, QuizCreateRequest request, bool isAdmin)
    {
        var attraction = await _context.Attractions.FirstOrDefaultAsync(a => a.Id == request.AttractionId);
        if (attraction == null)
        {
            return null;
        }

        if (!isAdmin && attraction.CreatedByUserId != userId)
        {
            throw new InvalidOperationException("Poți adăuga quiz-uri doar pentru atracțiile tale.");
        }

        var quiz = new Quiz
        {
            AttractionId = request.AttractionId,
            Title = request.Title,
            Description = request.Description,
            DifficultyLevel = request.DifficultyLevel,
            TimeLimit = request.TimeLimit,
            CreatedAt = DateTime.UtcNow,
            CreatedByUserId = userId,
            IsApproved = isAdmin || attraction.IsApproved
        };

        int order = 1;
        foreach (var questionRequest in request.Questions)
        {
            quiz.Questions.Add(BuildQuestionEntity(questionRequest, questionRequest.Order == 0 ? order : questionRequest.Order));
            order++;
        }

        _context.Quizzes.Add(quiz);
        await _context.SaveChangesAsync();

        return quiz;
    }

    public async Task<Quiz?> UpdateQuizAsync(int quizId, QuizUpdateRequest request, int userId, bool isAdmin)
    {
        var quiz = await _context.Quizzes
            .Include(q => q.Questions)
            .ThenInclude(q => q.Answers)
            .FirstOrDefaultAsync(q => q.Id == quizId);

        if (quiz == null)
        {
            return null;
        }

        if (!isAdmin && quiz.CreatedByUserId != userId)
        {
            throw new InvalidOperationException("Nu poți modifica acest quiz.");
        }

        if (quiz.AttractionId != request.AttractionId)
        {
            var attraction = await _context.Attractions.FirstOrDefaultAsync(a => a.Id == request.AttractionId);
            if (attraction == null)
            {
                throw new InvalidOperationException("Atracția aleasă nu există.");
            }
            if (!isAdmin && attraction.CreatedByUserId != userId)
            {
                throw new InvalidOperationException("Nu poți muta quiz-ul pe o altă atracție care nu îți aparține.");
            }
            quiz.AttractionId = request.AttractionId;
        }

        quiz.Title = request.Title;
        quiz.Description = request.Description;
        quiz.DifficultyLevel = request.DifficultyLevel;
        quiz.TimeLimit = request.TimeLimit;
        quiz.IsApproved = isAdmin || quiz.IsApproved;

        // Replace questions
        _context.Answers.RemoveRange(quiz.Questions.SelectMany(q => q.Answers));
        _context.Questions.RemoveRange(quiz.Questions);
        quiz.Questions.Clear();

        int order = 1;
        foreach (var questionRequest in request.Questions)
        {
            quiz.Questions.Add(BuildQuestionEntity(questionRequest, questionRequest.Order == 0 ? order : questionRequest.Order));
            order++;
        }

        await _context.SaveChangesAsync();
        return quiz;
    }

    public async Task<bool> DeleteQuizAsync(int quizId, int userId, bool isAdmin)
    {
        var quiz = await _context.Quizzes.FirstOrDefaultAsync(q => q.Id == quizId);
        if (quiz == null) return false;

        if (!isAdmin && quiz.CreatedByUserId != userId)
        {
            throw new InvalidOperationException("Nu poți șterge acest quiz.");
        }

        var progressEntries = await _context.UserProgresses
            .Where(up => up.QuizId == quizId)
            .ToListAsync();
        if (progressEntries.Count > 0)
        {
            _context.UserProgresses.RemoveRange(progressEntries);
        }

        _context.Quizzes.Remove(quiz);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<Quiz?> GetQuizForManagementAsync(int quizId, int userId, bool isAdmin)
    {
        var quiz = await _context.Quizzes
            .Include(q => q.Questions)
            .ThenInclude(q => q.Answers)
            .FirstOrDefaultAsync(q => q.Id == quizId);

        if (quiz == null)
        {
            return null;
        }

        if (!isAdmin && quiz.CreatedByUserId != userId)
        {
            throw new InvalidOperationException("Nu poți accesa acest quiz.");
        }

        return quiz;
    }
}
