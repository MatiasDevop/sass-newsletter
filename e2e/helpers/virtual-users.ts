export interface VirtualUser {
    username: string;
    email: string;
    password: string;
    generateResource: () => Promise<{ success: boolean; resourceId: string }>;
}

function generateFakeUser(index: number): VirtualUser {
    const names = ['Alice', 'Bob', 'Charlie', 'David', 'Eve'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const username = `${randomName.toLowerCase()}-${Date.now()}-${index}`;
    const randomEmail = `${username}@example.com`;
    return {
        username,
        email: randomEmail,
        password: 'password123',
        generateResource: async () => {
            // Simulate async resource generation with random delay
            await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
            return {
                success: true,
                resourceId: `resource-${username}-${Date.now()}`
            };
        }
    };
}

function createUserSession(user: VirtualUser) {
    // Simulate user session creation
    return {
        userId: Math.floor(Math.random() * 10000),
        user,
        sessionId: Math.random().toString(36).substring(2)
    };
}

function generateMultipleUsers(count: number) {
    const users = [];
    for (let i = 0; i < count; i++) {
        const user = generateFakeUser(i);
        const session = createUserSession(user);
        users.push(session);
    }
    return users;
}

export function createVirtualUsers(count: number): VirtualUser[] {
    return Array.from({ length: count }, (_, index) => generateFakeUser(index));
}

export { generateFakeUser, createUserSession };