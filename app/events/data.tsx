// Events data placeholder
export const events = [
    {
        category: "Tech",
        events: [
            {
                title: "DeepSeek Workshop",
                description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.",
                thumbnail: "/test_img2.png",
                subcom: "Tech",
            },
            {
                title: "Bishi Bashi Championship",
                description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.",
                thumbnail: "/test_img2.png",
                subcom: "Tech",
            },
        ]
    },
    {
        category: "PPD",
        events: [
            {
                title: "NUS Alumni Career Talk",
                description: "Lorem ipsum dolor sit amet.",
                thumbnail: "/test_img2.png",
                subcom: "PPD",
            },
        ]
    },
    {
        category: "Orientation Committee",
        events: [
            {
                title: "PINUS Orientation 2025",
                description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis.",
                thumbnail: "/test_img2.png",
                subcom: "Orientation Committee"
            }
        ]
    }
];

// Sorts all events
export const all_events = events
.flatMap(eventCategory => eventCategory.events)
.sort((a, b) => a.title.localeCompare(b.title));