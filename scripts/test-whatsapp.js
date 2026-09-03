const http = require('http');

function postJSON(urlStr, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const postData = JSON.stringify(data);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port || 3002,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            resolve(body);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function runTest() {
  console.log('🚀 Starting Full WhatsApp New Group & Work Status Test...\n');

  const batchName = `LMT-TEST-BATCH-${Date.now().toString().slice(-4)}`;
  console.log(`1️⃣ Creating New Batch: "${batchName}" with numbers 9737356415 & 8340729468...`);

  try {
    const batchRes = await postJSON('http://127.0.0.1:3002/api/batches', {
      name: batchName,
      course_id: 'crs_1',
      course_name: 'Python & Web Development',
      trainer_id: 'usr_trainer_1',
      total_hours: 60,
      batch_type: 'training',
      auto_whatsapp_group: true,
      students: [
        { name: 'Student 1', phone: '9737356415' },
        { name: 'Student 2', phone: '8340729468' },
      ],
    });

    console.log('✅ Batch API Response:', batchRes);
    const batchId = batchRes?.batch?.id || batchRes?.id;
    const waGroupId = batchRes?.batch?.whatsapp_group_id;
    console.log(`📌 Created Batch ID: ${batchId}, WhatsApp Group ID: ${waGroupId}\n`);

    console.log('2️⃣ Submitting Work Status for the newly created batch...');
    const sessionRes = await postJSON('http://127.0.0.1:3002/api/sessions', {
      batch_id: batchId,
      trainer_id: 'usr_trainer_1',
      trainer_name: 'KANZARIYA PRATIK',
      date: new Date().toISOString().split('T')[0],
      hours_taken: 2,
      description: 'MODULE 1 >> Introduction to Python, Variables & Data Types\n• Overview of Python environment\n• Setting up VS Code and running first script',
      selected_topics: ['Introduction to Python', 'Variables & Data Types'],
      students_attendance: [
        { student_id: 'st_1', student_name: 'Student 1', status: 'present' },
        { student_id: 'st_2', student_name: 'Student 2', status: 'present' },
      ],
    });

    console.log('✅ Session Work Status API Response:', sessionRes);
    console.log('\n🎉 ALL TESTS COMPLETED! Check WhatsApp on your phone!');
  } catch (err) {
    console.error('❌ Test Failed:', err.message);
  }
}

runTest();
