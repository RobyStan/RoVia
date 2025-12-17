using RoVia.API.Models;

namespace RoVia.API.Data;

public static partial class DataSeeder
{
    public static void SeedAttractions(AppDbContext context)
    {
        SeedRoles(context);
        SeedAdministrator(context);

        // Înlocuire: nu mai ieși imediat dacă există atracții.
        // Adaugă atracțiile doar când nu există, dar continuă să rulezi seed pentru quiz-uri și badge-uri.
        if (!context.Attractions.Any())
        {
            var now = DateTime.UtcNow;
            var attractions = new List<Attraction>
            {
                new()
                {
                    Name = "Castelul Peleș",
                    Description = "Castel regal din secolul XIX, situat în Sinaia, Prahova.",
                    Latitude = 45.3599,
                    Longitude = 25.5428,
                    Type = AttractionType.Historic,
                    Region = "Muntenia",
                    ImageUrl = "https://muzeu.ticketsys.ro/resources/eventImages/image90.jpg",
                    Rating = 4.8,
                    CreatedAt = now,
                    UpdatedAt = now,
                    IsApproved = true
                },
                new()
                {
                    Name = "Palatul Parlamentului",
                    Description = "Una dintre cele mai mari clădiri administrative din lume.",
                    Latitude = 44.4268,
                    Longitude = 26.0873,
                    Type = AttractionType.Cultural,
                    Region = "Muntenia",
                    ImageUrl = "https://www.bucuresti.ro/tthumbs/964/800x600.jpg",
                    Rating = 4.5,
                    CreatedAt = now,
                    UpdatedAt = now,
                    IsApproved = true
                },
                new()
                {
                    Name = "Cetatea Râșnov",
                    Description = "Fortificație medievală din secolul XIII.",
                    Latitude = 45.5877,
                    Longitude = 25.4608,
                    Type = AttractionType.Historic,
                    Region = "Transilvania",
                    ImageUrl = "https://static4.libertatea.ro/wp-content/uploads/2021/07/cetatea-rasnov-unde-se-afla-si-ce-activitati-poti-face--trasee-si-obiective-turistice-.jpeg",
                    Rating = 4.3,
                    CreatedAt = now,
                    UpdatedAt = now,
                    IsApproved = true
                },
                new()
                {
                    Name = "Lacul Roșu",
                    Description = "Lac natural format în urma unei alunecări de teren.",
                    Latitude = 46.6895,
                    Longitude = 25.9525,
                    Type = AttractionType.Natural,
                    Region = "Transilvania",
                    ImageUrl = "https://image.stirileprotv.ro/media/images/680xX/Nov2023/62404707.jpg",
                    Rating = 4.6,
                    CreatedAt = now,
                    UpdatedAt = now,
                    IsApproved = true
                },
                new()
                {
                    Name = "Mănăstirea Voroneț",
                    Description = "Mănăstire celebră pentru frescele sale exterioare.",
                    Latitude = 47.5414,
                    Longitude = 25.9167,
                    Type = AttractionType.Religious,
                    Region = "Moldova",
                    ImageUrl = "https://upload.wikimedia.org/wikipedia/commons/b/b8/Voronet_Intrare.JPG",
                    Rating = 4.7,
                    CreatedAt = now,
                    UpdatedAt = now,
                    IsApproved = true
                },
                new()
                {
                    Name = "Orașul antic Callatis",
                    Description = "Orașul antic Callatis este un sit arheologic aflat pe teritoriul municipiului Mangalia. Mangalia de astăzi este una dintre cele mai vechi așezări de pe teritoriul României, și singura fostă colonie dorică din România.",
                    Latitude = 43.815142,
                    Longitude = 28.583287,
                    Type = AttractionType.Historic,
                    Region = "Dobrogea",
                    ImageUrl = "https://www.constantareala.ro/wp-content/uploads/2023/06/poza-1-6.jpg",
                    Rating = 5.0,
                    CreatedAt = now,
                    UpdatedAt = now,
                    IsApproved = true
                },
                new()
                {
                    Name = "Salina Turda",
                    Description = "Salină spectaculoasă transformată în parc tematic subteran.",
                    Latitude = 46.5925,
                    Longitude = 23.7803,
                    Type = AttractionType.Entertainment,
                    Region = "Transilvania",
                    ImageUrl = "https://images.unsplash.com/photo-1529927066849-565ef4204abe",
                    Rating = 4.9,
                    CreatedAt = now,
                    UpdatedAt = now,
                    IsApproved = true
                },
                new()
                {
                    Name = "Delta Dunării",
                    Description = "Rezervație biosferică UNESCO, paradis pentru biodiversitate.",
                    Latitude = 45.1233,
                    Longitude = 29.6417,
                    Type = AttractionType.Natural,
                    Region = "Dobrogea",
                    ImageUrl = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
                    Rating = 4.9,
                    CreatedAt = now,
                    UpdatedAt = now,
                    IsApproved = true
                },
                new()
                {
                    Name = "Transfăgărășan",
                    Description = "Drum alpin iconic cu priveliști dramatice peste Munții Făgăraș.",
                    Latitude = 45.5981,
                    Longitude = 24.6169,
                    Type = AttractionType.Natural,
                    Region = "Transilvania",
                    ImageUrl = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
                    Rating = 4.9,
                    CreatedAt = now,
                    UpdatedAt = now,
                    IsApproved = true
                },
                new()
                {
                    Name = "Cimitirul Vesel",
                    Description = "Colecție de cruci viu colorate cu mesaje satirice despre viața celor îngropați.",
                    Latitude = 47.9747,
                    Longitude = 23.6942,
                    Type = AttractionType.Cultural,
                    Region = "Maramureș",
                    ImageUrl = "https://images.unsplash.com/photo-1500534314217-1e6a93512a4d",
                    Rating = 4.4,
                    CreatedAt = now,
                    UpdatedAt = now,
                    IsApproved = true
                },
                new()
                {
                    Name = "Cetatea Alba Carolina",
                    Description = "Cetate bastionară de tip Vauban, simbol al Marii Uniri.",
                    Latitude = 46.0713,
                    Longitude = 23.5736,
                    Type = AttractionType.Historic,
                    Region = "Alba",
                    ImageUrl = "https://images.unsplash.com/photo-1469474968028-56623f02e42e",
                    Rating = 4.6,
                    CreatedAt = now,
                    UpdatedAt = now,
                    IsApproved = true
                },
                new()
                {
                    Name = "Cheile Bicazului",
                    Description = "Defileu dramatic sculptat de râul Bicaz între Munții Hășmaș.",
                    Latitude = 46.8122,
                    Longitude = 25.8061,
                    Type = AttractionType.Natural,
                    Region = "Neamț",
                    ImageUrl = "https://images.unsplash.com/photo-1500534314217-1e6a93512a4d",
                    Rating = 4.7,
                    CreatedAt = now,
                    UpdatedAt = now,
                    IsApproved = true
                },
                new()
                {
                    Name = "Mocănița de pe Valea Vaserului",
                    Description = "Cale ferată forestieră cu tren cu aburi prin pădurile Maramureșului.",
                    Latitude = 47.7208,
                    Longitude = 24.3654,
                    Type = AttractionType.Cultural,
                    Region = "Maramureș",
                    ImageUrl = "https://images.unsplash.com/photo-1500534314217-1e6a93512a4d",
                    Rating = 4.5,
                    CreatedAt = now,
                    UpdatedAt = now,
                    IsApproved = true
                },
                new()
                {
                    Name = "Sighișoara Medievală",
                    Description = "Singura cetate medievală locuită din Europa de Est, listată UNESCO.",
                    Latitude = 46.2190,
                    Longitude = 24.7922,
                    Type = AttractionType.Historic,
                    Region = "Transilvania",
                    ImageUrl = "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05",
                    Rating = 4.8,
                    CreatedAt = now,
                    UpdatedAt = now,
                    IsApproved = true
                }
            };

            context.Attractions.AddRange(attractions);
            context.SaveChanges();
        }

        // Adaugă Quiz-uri pentru orice atracție care nu are încă unul
        var attractionIdsWithQuiz = context.Quizzes.Select(q => q.AttractionId).ToHashSet();
        var attractionsWithoutQuiz = context.Attractions
            .Where(a => !attractionIdsWithQuiz.Contains(a.Id))
            .ToList();

        if (attractionsWithoutQuiz.Any())
        {
            foreach (var attraction in attractionsWithoutQuiz)
            {
                var quiz = new Quiz
                {
                    AttractionId = attraction.Id,
                    Title = $"Quiz: {attraction.Name}",
                    Description = $"Testează-ți cunoștințele despre {attraction.Name}",
                    DifficultyLevel = 2,
                    TimeLimit = 300,
                    CreatedAt = DateTime.UtcNow,
                    IsApproved = true
                };

                context.Quizzes.Add(quiz);
                context.SaveChanges();

                var templates = BuildCustomQuestionTemplates(attraction, quiz.Id) ?? BuildQuestionTemplates(attraction, quiz.Id);

                context.Questions.AddRange(templates.Select(t => t.Question));
                context.SaveChanges();

                var persistedQuestions = context.Questions
                    .Where(q => q.QuizId == quiz.Id)
                    .OrderBy(q => q.Order)
                    .ToList();

                for (var i = 0; i < persistedQuestions.Count; i++)
                {
                    var answers = templates[i].Answers
                        .Select((answer, idx) => new Answer
                        {
                            QuestionId = persistedQuestions[i].Id,
                            Text = answer.Text,
                            IsCorrect = answer.IsCorrect,
                            Order = idx + 1
                        });

                    context.Answers.AddRange(answers);
                }

                context.SaveChanges();
            }
        }

        // Adaugă badge-uri dacă nu există
        if (!context.Badges.Any())
        {
            context.Badges.AddRange(new List<Badge>
            {
                new Badge
                {
                    Name = "Prima Stea",
                    Description = "Completează primul quiz",
                    IconUrl = "⭐",
                    RequiredPoints = 0,
                    Criteria = "{\"quizzesCompleted\": 1}"
                },
                new Badge
                {
                    Name = "Explorator",
                    Description = "Completează 5 quiz-uri",
                    IconUrl = "🗺️",
                    RequiredPoints = 0,
                    Criteria = "{\"quizzesCompleted\": 5}"
                },
                new Badge
                {
                    Name = "Campion",
                    Description = "Acumulează 500 de puncte",
                    IconUrl = "🏆",
                    RequiredPoints = 500,
                    Criteria = "{\"totalPoints\": 500}"
                }
            });

            context.SaveChanges();
        }
    }
}

public static partial class DataSeeder
{
    private static void SeedRoles(AppDbContext context)
    {
        if (context.Roles.Any()) return;

        context.Roles.AddRange(new List<Role>
        {
            new Role { Id = 1, Name = "Visitor" },
            new Role { Id = 2, Name = "Promoter" },
            new Role { Id = 3, Name = "Administrator" }
        });

        context.SaveChanges();
    }

    private static void SeedAdministrator(AppDbContext context)
    {
        if (context.Users.Any(u => u.Email == "admin@rovia.app")) return;

        var adminRole = context.Roles.FirstOrDefault(r => r.Name == "Administrator") ?? context.Roles.First();

        var admin = new User
        {
            Username = "admin",
            Email = "admin@rovia.app",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
            RoleId = adminRole.Id,
            CreatedAt = DateTime.UtcNow,
            TotalPoints = 0
        };

        context.Users.Add(admin);
        context.SaveChanges();
    }

    private static List<QuestionTemplate> BuildQuestionTemplates(Attraction attraction, int quizId)
    {
        var now = DateTime.UtcNow;
        var ratingLabel = $"{Math.Round(attraction.Rating, 1).ToString("0.0", System.Globalization.CultureInfo.InvariantCulture)} / 5";
        var typeLabel = TranslateAttractionType(attraction.Type);

        return new List<QuestionTemplate>
        {
            new(
                new Question
                {
                    QuizId = quizId,
                    Text = $"Care este caracteristica principală a {attraction.Name}?",
                    PointsValue = 10,
                    Order = 1,
                    CreatedAt = now
                },
                new List<AnswerTemplate>
                {
                    new("Frumusețe și importanță istorică", true),
                    new("Zgomot și poluare", false),
                    new("Lipsă totală de vizitatori", false)
                }),
            new(
                new Question
                {
                    QuizId = quizId,
                    Text = $"În ce regiune se află {attraction.Name}?",
                    PointsValue = 8,
                    Order = 2,
                    CreatedAt = now
                },
                new List<AnswerTemplate>
                {
                    new(attraction.Region, true),
                    new("Dobrogea", false),
                    new("Banat", false)
                }),
            new(
                new Question
                {
                    QuizId = quizId,
                    Text = $"Ce tip de experiență oferă {attraction.Name}?",
                    PointsValue = 12,
                    Order = 3,
                    CreatedAt = now
                },
                new List<AnswerTemplate>
                {
                    new(typeLabel, true),
                    new("Destinație industrială", false),
                    new("Centru comercial modern", false)
                }),
            new(
                new Question
                {
                    QuizId = quizId,
                    Text = $"Ce scor de recomandare are {attraction.Name}?",
                    PointsValue = 10,
                    Order = 4,
                    CreatedAt = now
                },
                new List<AnswerTemplate>
                {
                    new(ratingLabel, true),
                    new("2.1 / 5", false),
                    new("3.4 / 5", false)
                }),
            new(
                new Question
                {
                    QuizId = quizId,
                    Text = $"Adevărat sau Fals: {attraction.Name} contribuie la promovarea turismului românesc.",
                    PointsValue = 8,
                    Order = 5,
                    CreatedAt = now
                },
                new List<AnswerTemplate>
                {
                    new("Adevărat", true),
                    new("Fals", false)
                }),
            new(
                new Question
                {
                    QuizId = quizId,
                    Text = $"Adevărat sau Fals: {attraction.Name} este complet necunoscută vizitatorilor.",
                    PointsValue = 8,
                    Order = 6,
                    CreatedAt = now
                },
                new List<AnswerTemplate>
                {
                    new("Adevărat", false),
                    new("Fals", true)
                })
        };
    }

    private static string TranslateAttractionType(AttractionType type) => type switch
    {
        AttractionType.Natural => "atracție naturală iconică",
        AttractionType.Cultural => "loc cultural vibrant",
        AttractionType.Historic => "sit istoric emblematic",
        AttractionType.Entertainment => "destinație de divertisment",
        AttractionType.Religious => "loc de pelerinaj celebru",
        _ => "destinație turistică"
    };

    private sealed record QuestionTemplate(Question Question, List<AnswerTemplate> Answers);
    private sealed record AnswerTemplate(string Text, bool IsCorrect);

    private static List<QuestionTemplate>? BuildCustomQuestionTemplates(Attraction attraction, int quizId)
    {
        if (!string.Equals(attraction.Name, "Orașul antic Callatis", StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        var now = DateTime.UtcNow;

        return new List<QuestionTemplate>
        {
            new(
                new Question
                {
                    QuizId = quizId,
                    Text = "Unde era situat orașul antic Callatis?",
                    PointsValue = 10,
                    Order = 1,
                    CreatedAt = now
                },
                new List<AnswerTemplate>
                {
                    new("Pe litoralul Mării Negre, în actualul oraș Mangalia", true),
                    new("În apropiere de Cluj-Napoca, în Câmpia Transilvaniei", false),
                    new("În vestul Olteniei, lângă Târgu Jiu", false)
                }),
            new(
                new Question
                {
                    QuizId = quizId,
                    Text = "Cine a fondat orașul Callatis?",
                    PointsValue = 10,
                    Order = 2,
                    CreatedAt = now
                },
                new List<AnswerTemplate>
                {
                    new("Coloniști greci din Heraclea Pontică", true),
                    new("Legiunile romane din vremea lui Traian", false),
                    new("Negustori venețieni din secolul al XIV-lea", false)
                }),
            new(
                new Question
                {
                    QuizId = quizId,
                    Text = "În ce perioadă a fost fondat Callatis?",
                    PointsValue = 10,
                    Order = 3,
                    CreatedAt = now
                },
                new List<AnswerTemplate>
                {
                    new("În secolul al IV-lea î.Hr., în epoca clasică greacă", true),
                    new("În secolul al IX-lea d.Hr., în timpul Primului Țarat Bulgar", false),
                    new("În secolul al XVIII-lea, în epoca fanariotă", false)
                })
        };
    }
}
