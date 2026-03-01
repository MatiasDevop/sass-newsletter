import { test, expect } from '@playwright/test';
import { createVirtualUsers } from './helpers/virtual-users';

test('multiple fake users generating resources concurrently', async () => {
    const users = createVirtualUsers(10); // Create 10 virtual users
    const results = await Promise.all(users.map(user => user.generateResource()));

    results.forEach(result => {
        expect(result).toBeTruthy(); // Ensure each resource generation is successful
    });
});