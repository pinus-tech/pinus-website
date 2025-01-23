// would likely be moved to notion backend

interface CommitteeGroup {
    name: string;
    key: string;
    members: Committee[];
}

type Committee = {
    name: string;
    role: string;
    // image: string; // Commented out for now because still using placeholders
}


export const committeeData: CommitteeGroup[]= [
    {
        name: "Executive Committee",
        key: "executive-committee",
        members: [
            {
                name: "Cullen Sean",
                role: "President"
            }, {
                name: "Hastuti Hera Hardiyanti",
                role: "Vice President"
            }, {
                name: "Karen Lie",
                role: "General Secretary"
            }, {
                name: "Puspa Tania Zahrani",
                role: "Community Affairs Secretary"
            }, {
                name: "Charly Chandra",
                role: "Financial Secretary"
            }
        ]
    }, {
        name: "Technology",
        key: "technology",
        members: [
            {
                name: "Muhammad Nurul Akbar",
                role: "Tech Director",
            }, {
                name: "Evan Darren Christanto",
                role: "Tech Director"
            }
        ]
    }
]