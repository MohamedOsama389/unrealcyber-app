const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000/api';

async function run() {
    try {
        // 1. Login as Admin
        console.log("Logging in as Admin...");
        const adminRes = await axios.post(`${BASE_URL}/auth/login`, {
            username: 'Lloyed',
            password: 'root@14112009'
        });
        const adminToken = adminRes.data.token;
        console.log("Admin logged in.");

        // 2. Create Task
        console.log("Creating Task...");
        const taskTitle = 'Test Task ' + Date.now();
        await axios.post(`${BASE_URL}/tasks`, {
            title: taskTitle,
            drive_link: 'http://example.com',
            notes: 'Test notes'
        }, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        console.log("Task created.");

        // Get Task ID
        const tasksRes = await axios.get(`${BASE_URL}/tasks`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const task = tasksRes.data.find(t => t.title === taskTitle);
        if (!task) throw new Error("Task not found");
        console.log("Task ID:", task.id);

        // 3. Register/Login as Student
        const studentName = 'student_test_' + Date.now();
        console.log(`Registering Student ${studentName}...`);
        try {
            await axios.post(`${BASE_URL}/auth/register`, {
                username: studentName,
                password: 'password'
            });
        } catch (e) {
            // ignore if exists
        }

        console.log("Logging in as Student...");
        const studentRes = await axios.post(`${BASE_URL}/auth/login`, {
            username: studentName,
            password: 'password'
        });
        const studentToken = studentRes.data.token;
        console.log("Student logged in.");

        // 4. Upload File
        console.log("Uploading File...");
        const form = new FormData();
        form.append('task_id', task.id);
        form.append('notes', 'My submission notes');

        // Create a dummy file
        const dummyFilePath = path.join(__dirname, 'dummy.txt');
        fs.writeFileSync(dummyFilePath, 'Hello World Submission');
        form.append('file', fs.createReadStream(dummyFilePath));

        const uploadRes = await axios.post(`${BASE_URL}/tasks/upload`, form, {
            headers: {
                Authorization: `Bearer ${studentToken}`,
                ...form.getHeaders()
            }
        });

        console.log("Upload Success:", uploadRes.data);

        // cleanup
        fs.unlinkSync(dummyFilePath);

    } catch (err) {
        if (err.response) {
            console.error("Error Response:", err.response.status, err.response.data);
        } else {
            console.error("Error:", err.message);
        }
    }
}

run();
