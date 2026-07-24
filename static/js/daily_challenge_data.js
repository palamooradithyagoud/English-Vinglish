/**
 * Daily Challenge Curriculum Data (Levels 1 to 20)
 * Duolingo-style progressive learning path for English Winglish
 */

window.DAILY_CHALLENGE_DATA = [
    // LEVEL 1
    {
        id: 1,
        title: "Daily Greetings & Introductions",
        desc: "Learn basic conversational greetings, self-introductions, and polite expressions.",
        xp: 50,
        difficulty: "Beginner",
        exercises: [
            {
                type: "dialogue",
                title: "At the Coffee Shop",
                speakers: { person1: { name: "Alex", avatar: "👨‍💼" }, person2: { name: "Sarah", avatar: "👩‍💼" } },
                lines: [
                    { speaker: "person1", text: "Good morning! How are you doing today?" },
                    { speaker: "person2", text: "I'm doing great, thank you! ___?" }
                ],
                question: "Choose the most polite and natural response for Sarah:",
                options: ["How about you?", "What do you want?", "Bye bye", "No thanks"],
                correctIndex: 0,
                explanation: "'How about you?' is a friendly and polite way to return a casual greeting."
            },
            {
                type: "matching",
                title: "Match Greetings with Meaning",
                prompt: "Tap pairs that mean the same thing:",
                pairs: [
                    { left: "How's it going?", right: "How are you?" },
                    { left: "Pleased to meet you.", right: "Nice to meet you." },
                    { left: "Catch you later!", right: "See you soon!" },
                    { left: "Good day!", right: "Formal Hello" }
                ]
            },
            {
                type: "fill_blank",
                title: "Complete the Sentence",
                sentence: "Hello, my ___ is Alex and I am glad to meet you.",
                wordBank: ["name", "call", "friend", "home"],
                correctAnswer: "name",
                explanation: "'My name is...' is the standard structure for introducing oneself."
            },
            {
                type: "meaning",
                title: "Choose the Best Response",
                prompt: "Someone says to you: 'Nice meeting you!' What should you say back?",
                options: ["Nice meeting you too!", "I don't know.", "Yes, please.", "Sorry, no."],
                correctIndex: 0,
                explanation: "Adding 'too' at the end is polite when returning a meeting pleasure greeting."
            },
            {
                type: "dialogue",
                title: "First Day at Work",
                speakers: { person1: { name: "David", avatar: "👨‍💻" }, person2: { name: "Emma", avatar: "👩‍💻" } },
                lines: [
                    { speaker: "person1", text: "Hi! Are you the new UI designer?" },
                    { speaker: "person2", text: "Yes, I am! My name is Emma." },
                    { speaker: "person1", text: "___ to the team, Emma!" }
                ],
                question: "Complete David's sentence:",
                options: ["Welcome", "Goodbye", "Excuse me", "Pardon"],
                correctIndex: 0,
                explanation: "'Welcome to the team!' is the warm standard greeting for a new colleague."
            }
        ]
    },

    // LEVEL 2
    {
        id: 2,
        title: "Ordering at a Restaurant",
        desc: "Practice polite ordering, asking about the menu, and handling the bill.",
        xp: 60,
        difficulty: "Beginner",
        exercises: [
            {
                type: "dialogue",
                title: "At the Cafe Counter",
                speakers: { person1: { name: "Waiter", avatar: "🧑‍🍳" }, person2: { name: "Customer", avatar: "👩" } },
                lines: [
                    { speaker: "person1", text: "Hello! What can I get started for you today?" },
                    { speaker: "person2", text: "___ I have a cappuccino with almond milk, please?" }
                ],
                question: "Complete the polite request:",
                options: ["Could", "Must", "Will", "Should"],
                correctIndex: 0,
                explanation: "'Could I have...' is a polite phrasing for ordering food or drinks."
            },
            {
                type: "matching",
                title: "Restaurant Phrases Matching",
                prompt: "Match restaurant phrases with their purpose:",
                pairs: [
                    { left: "Check, please!", right: "Asking for the bill" },
                    { left: "What do you recommend?", right: "Asking for suggestions" },
                    { left: "To go, please.", right: "Takeaway order" },
                    { left: "Is this gluten-free?", right: "Dietary question" }
                ]
            },
            {
                type: "fill_blank",
                title: "Complete the Order",
                sentence: "We would like a ___ for two near the window, please.",
                wordBank: ["table", "food", "chair", "water"],
                correctAnswer: "table",
                explanation: "When arriving at a restaurant, you request a 'table for two'."
            },
            {
                type: "meaning",
                title: "Understanding Idiomatic Expressions",
                prompt: "What does 'It's on me' mean when paying a restaurant bill?",
                options: ["I will pay for everyone.", "The food spilled on me.", "Please split the bill.", "I don't have money."],
                correctIndex: 0,
                explanation: "'It's on me' is a common informal idiom meaning 'I will pay the entire bill'."
            },
            {
                type: "dialogue",
                title: "Paying the Bill",
                speakers: { person1: { name: "Waiter", avatar: "🧑‍🍳" }, person2: { name: "Customer", avatar: "👨" } },
                lines: [
                    { speaker: "person1", text: "How was everything with your meal?" },
                    { speaker: "person2", text: "It was delicious! Can we get the bill, please?" },
                    { speaker: "person1", text: "Certainly! Will you be paying together or ___?" }
                ],
                question: "Complete the waiter's question:",
                options: ["separately", "never", "tomorrow", "fast"],
                correctIndex: 0,
                explanation: "'Paying separately' or 'splitting the bill' means paying individually."
            }
        ]
    },

    // LEVEL 3
    {
        id: 3,
        title: "Asking Directions & Transport",
        desc: "Learn to navigate the city, ask for locations, and use public transit.",
        xp: 70,
        difficulty: "Beginner",
        exercises: [
            {
                type: "dialogue",
                title: "Finding the Subway Station",
                speakers: { person1: { name: "Tourist", avatar: "🧳" }, person2: { name: "Local Resident", avatar: "🚴" } },
                lines: [
                    { speaker: "person1", text: "Excuse me! Could you tell me where the nearest subway station is?" },
                    { speaker: "person2", text: "Sure! Walk straight for two blocks, then turn ___." }
                ],
                question: "Choose the spatial direction word:",
                options: ["left", "yesterday", "loudly", "quickly"],
                correctIndex: 0,
                explanation: "'Turn left' or 'turn right' are cardinal direction instructions."
            },
            {
                type: "matching",
                title: "Match Transit Words",
                prompt: "Match direction words with their meanings:",
                pairs: [
                    { left: "Straight ahead", right: "Keep going forward" },
                    { left: "Cross the street", right: "Go to the other side" },
                    { left: "Across from", right: "Opposite to" },
                    { left: "Roundabout", right: "Circular junction" }
                ]
            },
            {
                type: "fill_blank",
                title: "Bus Ticket Booking",
                sentence: "How much is a single ___ to Central Park?",
                wordBank: ["ticket", "road", "walk", "drive"],
                correctAnswer: "ticket",
                explanation: "You purchase a 'ticket' to travel on public transportation."
            },
            {
                type: "meaning",
                title: "Location Terminology",
                prompt: "If a building is 'adjacent to' the pharmacy, where is it?",
                options: ["Next to it", "Far away from it", "On top of it", "Inside it"],
                correctIndex: 0,
                explanation: "'Adjacent to' means directly next to or beside another location."
            }
        ]
    },

    // LEVEL 4
    {
        id: 4,
        title: "Shopping & Price Bargaining",
        desc: "Ask about clothing sizes, discounts, and prices politely in English.",
        xp: 80,
        difficulty: "Beginner",
        exercises: [
            {
                type: "dialogue",
                title: "In a Clothing Store",
                speakers: { person1: { name: "Customer", avatar: "🛍️" }, person2: { name: "Store Assistant", avatar: "👔" } },
                lines: [
                    { speaker: "person1", text: "Hi, I really like this jacket. Do you have it in a medium size?" },
                    { speaker: "person2", text: "Let me check our stock! Would you like to ___ it on?" }
                ],
                question: "Complete the shop assistant's question:",
                options: ["try", "wear", "eat", "sell"],
                correctIndex: 0,
                explanation: "'Try it on' means putting on clothing in a shop to check fit."
            },
            {
                type: "matching",
                title: "Shopping Terminology",
                prompt: "Match retail terms with their explanations:",
                pairs: [
                    { left: "Fitting room", right: "Where you try on clothes" },
                    { left: "Receipt", right: "Proof of purchase" },
                    { left: "Refund", right: "Money returned for item" },
                    { left: "Discount", right: "Price reduction" }
                ]
            },
            {
                type: "fill_blank",
                title: "Asking for Discount",
                sentence: "Is there any current ___ on this item?",
                wordBank: ["discount", "size", "color", "label"],
                correctAnswer: "discount",
                explanation: "A discount refers to a percentage or amount off the original price."
            }
        ]
    },

    // LEVEL 5
    {
        id: 5,
        title: "Talking About Hobbies & Daily Routine",
        desc: "Describe your free time activities, daily schedules, and favorite passions.",
        xp: 90,
        difficulty: "Beginner",
        exercises: [
            {
                type: "dialogue",
                title: "Weekend Plans",
                speakers: { person1: { name: "Mia", avatar: "👩‍🎨" }, person2: { name: "Liam", avatar: "🎧" } },
                lines: [
                    { speaker: "person1", text: "Hey Liam! What do you usually do on weekends?" },
                    { speaker: "person2", text: "I love hiking in the mountains. How about you?" },
                    { speaker: "person1", text: "I prefer staying home and ___ books." }
                ],
                question: "Complete Mia's hobby sentence:",
                options: ["reading", "driving", "buying", "fixing"],
                correctIndex: 0,
                explanation: "'Reading books' is a common weekend leisure hobby."
            },
            {
                type: "matching",
                title: "Match Hobbies with Verbs",
                prompt: "Match activities with the correct action verb:",
                pairs: [
                    { left: "___ guitar", right: "Play" },
                    { left: "___ photography", right: "Practice" },
                    { left: "___ for a run", right: "Go" },
                    { left: "___ yoga", right: "Do" }
                ]
            }
        ]
    },

    // LEVEL 6 TO 20 (GENERATED CURRICULUM PATTERNS)
    {
        id: 6,
        title: "Weather & Travel Plans",
        desc: "Discuss weather forecasts, packing lists, and vacation destinations.",
        xp: 100,
        difficulty: "Intermediate",
        exercises: [
            {
                type: "dialogue",
                title: "Planning a Beach Trip",
                speakers: { person1: { name: "Carlos", avatar: "🏄" }, person2: { name: "Elena", avatar: "🌴" } },
                lines: [
                    { speaker: "person1", text: "Did you see the weather forecast for tomorrow?" },
                    { speaker: "person2", text: "Yes! It's going to be sunny and warm. Perfect for the beach!" }
                ],
                question: "What items should Carlos bring?",
                options: ["Sunscreen and sunglasses", "A heavy winter coat", "An umbrella and snow boots", "A fireplace"],
                correctIndex: 0,
                explanation: "Sunscreen and sunglasses are essential for warm, sunny beach trips."
            },
            {
                type: "fill_blank",
                title: "Complete the Sentence",
                sentence: "It is raining heavily outside; make sure to take your ___.",
                wordBank: ["umbrella", "camera", "passport", "sunglasses"],
                correctAnswer: "umbrella",
                explanation: "An umbrella protects you from heavy rain."
            }
        ]
    },

    {
        id: 7,
        title: "Making Reservations & Hotel Stay",
        desc: "Book hotel rooms, request room service, and check in at the front desk.",
        xp: 110,
        difficulty: "Intermediate",
        exercises: [
            {
                type: "matching",
                title: "Hotel Vocabulary",
                prompt: "Match hotel terms with definitions:",
                pairs: [
                    { left: "Check-in time", right: "When room becomes ready" },
                    { left: "Wake-up call", right: "Alarm request to reception" },
                    { left: "Housekeeping", right: "Room cleaning service" },
                    { left: "Complimentary", right: "Free of charge" }
                ]
            }
        ]
    },

    {
        id: 8,
        title: "Health & Doctor Visits",
        desc: "Explain symptoms, understand medical advice, and buy pharmacy medicines.",
        xp: 120,
        difficulty: "Intermediate",
        exercises: [
            {
                type: "dialogue",
                title: "At the Doctor's Office",
                speakers: { person1: { name: "Doctor", avatar: "👨‍⚕️" }, person2: { name: "Patient", avatar: "🤒" } },
                lines: [
                    { speaker: "person1", text: "What brings you in today?" },
                    { speaker: "person2", text: "I have a severe headache and a fever since yesterday." }
                ],
                question: "Choose the doctor's best response:",
                options: ["Let me check your temperature.", "Have a nice vacation!", "That sounds fun.", "Congratulations!"],
                correctIndex: 0,
                explanation: "Checking temperature is standard procedure when a patient reports a fever."
            }
        ]
    },

    {
        id: 9,
        title: "Job Interviews & Skills",
        desc: "Present your professional experience, strengths, and career ambitions.",
        xp: 130,
        difficulty: "Intermediate",
        exercises: [
            {
                type: "dialogue",
                title: "Interview Question",
                speakers: { person1: { name: "Interviewer", avatar: "👩‍💼" }, person2: { name: "Candidate", avatar: "👨‍💼" } },
                lines: [
                    { speaker: "person1", text: "What do you consider your greatest professional strength?" },
                    { speaker: "person2", text: "I am a strong problem solver and a dedicated team player." }
                ],
                question: "What skill is the candidate highlighting?",
                options: ["Analytical & teamwork skills", "Physical strength", "Cooking ability", "Speed reading"],
                correctIndex: 0,
                explanation: "Problem solving and teamwork are key soft skills highlighted in job interviews."
            }
        ]
    },

    {
        id: 10,
        title: "Workplace Email & Telephony",
        desc: "Master professional email greetings, scheduling meetings, and phone calls.",
        xp: 140,
        difficulty: "Intermediate",
        exercises: [
            {
                type: "matching",
                title: "Email Etiquette",
                prompt: "Match formal phrases with informal equivalents:",
                pairs: [
                    { left: "Please find attached", right: "Here is the file" },
                    { left: "I look forward to", right: "Can't wait to see" },
                    { left: "At your earliest convenience", right: "As soon as you can" },
                    { left: "Sincerely yours", right: "Best regards" }
                ]
            }
        ]
    },

    // LEVELS 11-20
    { id: 11, title: "Expressing Opinions & Debates", desc: "Use phrases like 'In my opinion' and 'From my perspective'.", xp: 150, difficulty: "Upper-Intermediate", exercises: [{ type: "meaning", title: "Opinion Phrases", prompt: "Which phrase politely expresses disagreement?", options: ["I see your point, but...", "You are wrong!", "Shut up.", "Whatever."], correctIndex: 0, explanation: "'I see your point, but...' is polite and professional." }] },
    { id: 12, title: "Phrasal Verbs in Action", desc: "Master essential verbs like 'carry out', 'bring up', and 'look into'.", xp: 160, difficulty: "Upper-Intermediate", exercises: [{ type: "matching", title: "Phrasal Verbs", prompt: "Match phrasal verbs with meanings:", pairs: [{ left: "Look into", right: "Investigate" }, { left: "Turn down", right: "Reject an offer" }, { left: "Call off", right: "Cancel an event" }, { left: "Figure out", right: "Understand/Solve" }] }] },
    { id: 13, title: "Technology & Digital AI Trends", desc: "Discuss software development, AI tools, and remote collaboration.", xp: 170, difficulty: "Upper-Intermediate", exercises: [{ type: "fill_blank", title: "Tech Terms", sentence: "Artificial Intelligence is transforming how we ___ data.", wordBank: ["analyze", "eat", "paint", "sleep"], correctAnswer: "analyze", explanation: "Data is analyzed using AI models." }] },
    { id: 14, title: "Financial & Money Idioms", desc: "Learn phrases like 'ballpark figure', 'break even', and 'cut corners'.", xp: 180, difficulty: "Upper-Intermediate", exercises: [{ type: "meaning", title: "Money Idioms", prompt: "What does 'break even' mean in business?", options: ["Neither make profit nor loss", "Go bankrupt", "Make a fortune", "Steal money"], correctIndex: 0, explanation: "Breaking even means total revenue equals total costs." }] },
    { id: 15, title: "Handling Customer Feedback & Conflict", desc: "De-escalate unhappy clients and offer solutions professionally.", xp: 190, difficulty: "Upper-Intermediate", exercises: [{ type: "dialogue", title: "Customer Care", speakers: { person1: { name: "Client", avatar: "😠" }, person2: { name: "Agent", avatar: "🎧" } }, lines: [{ speaker: "person1", text: "My delivery is late!" }, { speaker: "person2", text: "I sincerely apologize for the delay. Let me expedite it immediately." }], question: "How did the agent respond?", options: ["Professionally & apologetically", "Rudely", "Ignored client", "Blamed customer"], correctIndex: 0, explanation: "Answering politely and offering immediate assistance resolves conflicts." }] },
    
    // ADVANCED LEVELS 16-20
    { id: 16, title: "Business Negotiations & Deals", desc: "Negotiate pricing, contracts, and win-win compromises in business.", xp: 200, difficulty: "Advanced", exercises: [{ type: "matching", title: "Negotiation Terms", prompt: "Match terms with definitions:", pairs: [{ left: "Win-win", right: "Beneficial for both parties" }, { left: "Leverage", right: "Strategic advantage" }, { left: "Compromise", right: "Mutual concession" }, { left: "Counter-offer", right: "Alternative proposal" }] }] },
    { id: 17, title: "Public Speaking & Presentations", desc: "Deliver captivating presentations, slide hooks, and Q&A sessions.", xp: 210, difficulty: "Advanced", exercises: [{ type: "fill_blank", title: "Presentation Hook", sentence: "To ___ off today's presentation, let us review our key statistics.", wordBank: ["kick", "jump", "stop", "run"], correctAnswer: "kick", explanation: "'Kick off' means starting an event or presentation." }] },
    { id: 18, title: "Idioms & Cultural Metaphors", desc: "Master idioms like 'hit the nail on the head' and 'blessing in disguise'.", xp: 220, difficulty: "Advanced", exercises: [{ type: "meaning", title: "Idiom Challenge", prompt: "What does 'hit the nail on the head' mean?", options: ["Describe exact truth", "Hurt your finger", "Build a house", "Make a mistake"], correctIndex: 0, explanation: "It means to be completely accurate about something." }] },
    { id: 19, title: "Academic & Analytical Writing", desc: "Structure formal essays, thesis arguments, and research summaries.", xp: 230, difficulty: "Advanced", exercises: [{ type: "matching", title: "Academic Connectors", prompt: "Match transition words with functions:", pairs: [{ left: "Furthermore", right: "Adding an extra point" }, { left: "Consequently", right: "Showing result" }, { left: "In contrast", right: "Highlighting difference" }, { left: "To summarize", right: "Concluding arguments" }] }] },
    { id: 20, title: "Fluency Mastery & Native Nuances", desc: "Achieve native-level conversational nuance, tone, and register flexibility.", xp: 250, difficulty: "Mastery", exercises: [{ type: "dialogue", title: "Executive Decision", speakers: { person1: { name: "CEO", avatar: "💼" }, person2: { name: "VP", avatar: "📊" } }, lines: [{ speaker: "person1", text: "Shall we greenlight the global expansion project?" }, { speaker: "person2", text: "All metrics align. Let's move forward." }], question: "What does 'greenlight' mean in this context?", options: ["Give official approval", "Turn on a traffic light", "Cancel the project", "Change colors"], correctIndex: 0, explanation: "'Greenlight' means authorizing a project to proceed." }] }
];
