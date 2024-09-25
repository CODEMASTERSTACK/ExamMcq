let subjects = {};
let complaints = [];
let currentSubject = '';
let currentMCQIndex = 0;

// Initialize Firebase (replace with your config)
const firebaseConfig = {
    apiKey: "AIzaSyBmdQPtxzH0wempbP_KA24PLsMBLlBXlP8",
    authDomain: "home-financer-3d3d5.firebaseapp.com",
    databaseURL: "https://home-financer-3d3d5-default-rtdb.firebaseio.com",
    projectId: "home-financer-3d3d5",
    storageBucket: "home-financer-3d3d5.appspot.com",
    messagingSenderId: "235882407822",
    appId: "1:235882407822:web:a2c9b4c9c198d700c666df",
    measurementId: "G-E325LLTF0J"
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};
firebase.initializeApp(firebaseConfig);

const database = firebase.database();

// Load data from Firebase
function loadData() {
  database.ref('subjects').once('value', (snapshot) => {
    subjects = snapshot.val() || {};
    loadSubjectsUser();
  });

  database.ref('complaints').once('value', (snapshot) => {
    complaints = snapshot.val() || [];
    loadComplaints();
  });
}

// Save data to Firebase
function saveData() {
  database.ref('subjects').set(subjects);
  database.ref('complaints').set(complaints);
}

// Load Subjects for User Portal
function loadSubjectsUser() {
    const subjectList = document.getElementById("subject-list");
    if (!subjectList) return;
    
    subjectList.innerHTML = '';
    for (let subject in subjects) {
        let li = document.createElement("li");
        li.textContent = subject;
        li.onclick = () => loadMCQs(subject);
        subjectList.appendChild(li);
    }
}

// Load Subjects for Admin Portal
function loadSubjectsAdmin() {
    const subjectListAdmin = document.getElementById("subject-list-admin");
    if (!subjectListAdmin) return;
    
    subjectListAdmin.innerHTML = '';
    for (let subject in subjects) {
        let li = document.createElement("li");
        li.textContent = subject;
        
        let deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.onclick = () => deleteSubject(subject);
        
        let manageButton = document.createElement("button");
        manageButton.textContent = "Manage MCQs";
        manageButton.onclick = () => loadManageMCQs(subject);
        
        li.appendChild(deleteButton);
        li.appendChild(manageButton);
        subjectListAdmin.appendChild(li);
    }
}

// Add Subject
function addSubject() {
    const subjectInput = document.getElementById("subject-input");
    const subject = subjectInput.value.trim();
    if (subject && !subjects[subject]) {
        subjects[subject] = [];
        saveData();
        loadSubjectsAdmin();
        subjectInput.value = '';
        console.log("Subject added:", subject); // For debugging
    } else {
        alert("Subject is either empty or already exists.");
    }
}

// Delete Subject
function deleteSubject(subject) {
    delete subjects[subject];
    saveData();
    loadSubjectsAdmin();
}

// Load MCQs for User
function loadMCQs(subject) {
    currentSubject = subject;
    currentMCQIndex = 0;
    const mcqSection = document.getElementById("mcq-section");
    const subjectTitle = document.getElementById("subject-title");
    const mcqContent = document.getElementById("mcq-content");
    const submitButton = document.getElementById("submit-mcq");
    const nextButton = document.getElementById("next-mcq");
    
    if (!mcqSection || !subjectTitle || !mcqContent || !submitButton || !nextButton) return;
    
    subjectTitle.textContent = subject;
    mcqSection.style.display = "block";
    
    submitButton.onclick = submitAnswer;
    nextButton.onclick = loadNextMCQ;
    
    totalQuestions = subjects[subject].length;
    answeredQuestions = 0;
    updateProgressBar();
    loadNextMCQ();
}

// Load Next MCQ
function loadNextMCQ() {
    const mcqContent = document.getElementById("mcq-content");
    const submitButton = document.getElementById("submit-mcq");
    const nextButton = document.getElementById("next-mcq");
    
    if (currentMCQIndex >= subjects[currentSubject].length) {
        mcqContent.innerHTML = "<p>No more MCQs available for this subject.</p>";
        submitButton.style.display = "none";
        nextButton.style.display = "none";
        return;
    }
    
    const mcq = subjects[currentSubject][currentMCQIndex];
    mcqContent.innerHTML = `
        <p>${mcq.question}</p>
        ${mcq.options.map((option, idx) => `
            <input type="radio" name="mcq" id="option_${idx}" value="${option}">
            <label for="option_${idx}">${option}</label><br>
        `).join('')}
        <button onclick="raiseComplaint('${currentSubject}', ${currentMCQIndex})">Report Issue</button>
    `;
    
    submitButton.style.display = "inline-block";
    nextButton.style.display = "none";
    
    updateProgressBar();
}

// Submit Answer
function submitAnswer() {
    const selectedOption = document.querySelector('input[name="mcq"]:checked');
    if (!selectedOption) {
        alert("Please select an answer before submitting.");
        return;
    }
    
    const mcq = subjects[currentSubject][currentMCQIndex];
    const isCorrect = selectedOption.value === mcq.correctAnswer;
    const resultMessage = isCorrect ? "Correct!" : `Incorrect. The correct answer is: ${mcq.correctAnswer}`;
    
    const mcqContent = document.getElementById("mcq-content");
    mcqContent.innerHTML += `<div class="result-message ${isCorrect ? 'correct' : 'incorrect'}">${resultMessage}</div>`;
    
    document.getElementById("submit-mcq").style.display = "none";
    document.getElementById("next-mcq").style.display = "inline-block";
    
    answeredQuestions++;
    updateProgressBar();
    
    currentMCQIndex++;
}

// Load Manage MCQs for Admin
function loadManageMCQs(subject) {
    const manageMCQs = document.getElementById("manage-mcqs");
    const currentSubject = document.getElementById("current-subject");
    const mcqList = document.getElementById("mcq-list");
    
    if (!manageMCQs || !currentSubject || !mcqList) return;
    
    currentSubject.textContent = subject;
    mcqList.innerHTML = '';
    manageMCQs.style.display = "block";
    
    subjects[subject].forEach((mcq, index) => {
        let li = document.createElement("li");
        li.textContent = `${mcq.question} - Options: ${mcq.options.join(', ')} - Correct: ${mcq.correctAnswer}`;
        mcqList.appendChild(li);
    });
}

// Add MCQ
function addMCQ() {
    const subject = document.getElementById("current-subject").textContent;
    const question = document.getElementById("mcq-question").value;
    const options = [
        document.getElementById("mcq-option1").value,
        document.getElementById("mcq-option2").value,
        document.getElementById("mcq-option3").value,
        document.getElementById("mcq-option4").value
    ];
    const correctAnswer = document.getElementById("mcq-correct-answer").value;
    
    if (question && options.every(option => option) && correctAnswer) {
        subjects[subject].push({ question, options, correctAnswer });
        saveData();
        loadManageMCQs(subject);
        clearMCQInputs();
    } else {
        alert("Please fill in all fields!");
    }
}

// Clear MCQ Inputs
function clearMCQInputs() {
    document.getElementById("mcq-question").value = '';
    document.getElementById("mcq-option1").value = '';
    document.getElementById("mcq-option2").value = '';
    document.getElementById("mcq-option3").value = '';
    document.getElementById("mcq-option4").value = '';
    document.getElementById("mcq-correct-answer").value = '';
}

// Raise Complaint
function raiseComplaint(subject, index) {
    const message = prompt("Please describe the issue:");
    if (message) {
        complaints.push({ subject, index, message });
        saveData();
        alert("Complaint submitted.");
        loadComplaints(); // Refresh the complaints list in the admin portal
    }
}

// Load Complaints
function loadComplaints() {
    const complaintsList = document.getElementById("complaints-list");
    if (!complaintsList) return;
    
    complaintsList.innerHTML = '';
    complaints.forEach((complaint, index) => {
        let li = document.createElement("li");
        li.textContent = `Subject: ${complaint.subject}, MCQ Index: ${complaint.index}, Issue: ${complaint.message}`;
        complaintsList.appendChild(li);
    });
}

// Initialize
function init() {
    loadData();
    
    // User Portal
    loadSubjectsUser();
    
    // Admin Portal
    const addSubjectBtn = document.getElementById("add-subject");
    if (addSubjectBtn) {
        addSubjectBtn.onclick = addSubject;
    }
    loadSubjectsAdmin();
    loadComplaints();
    
    const addMCQBtn = document.getElementById("add-mcq");
    if (addMCQBtn) {
        addMCQBtn.onclick = addMCQ;
    }
}

// Run initialization on page load
window.onload = init;

// Update Progress Bar
function updateProgressBar() {
    const progressBar = document.getElementById("progress");
    const progress = (answeredQuestions / totalQuestions) * 100;
    progressBar.style.width = `${progress}%`;
}

document.addEventListener('DOMContentLoaded', () => {
    const userName = localStorage.getItem('userName');
    if (userName) {
        showGreeting(userName);
    } else {
        showNewUserGreeting();
    }
});

function showNewUserGreeting() {
    const overlay = document.getElementById('greeting-overlay');
    const greetingText = document.getElementById('greeting-text');
    const nameInputContainer = document.getElementById('name-input-container');
    const nameInput = document.getElementById('name-input');
    const submitNameBtn = document.getElementById('submit-name');

    overlay.style.opacity = '1';
    overlay.style.display = 'flex'; // Ensure the overlay is visible
    
    setTimeout(() => {
        greetingText.classList.add('fade-in-up');
    }, 500);

    setTimeout(() => {
        nameInputContainer.style.display = 'block';
        nameInputContainer.classList.add('fade-in-up');
    }, 1500);

    submitNameBtn.addEventListener('click', () => {
        const name = nameInput.value.trim();
        if (name) {
            localStorage.setItem('userName', name);
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.style.display = 'none'; // Hide the overlay
                showGreeting(name);
                loadSubjectsUser(); // Reload subjects after greeting
            }, 500);
        }
    });
}

function showGreeting(name) {
    const userGreeting = document.getElementById('user-greeting');
    userGreeting.textContent = `Welcome back, ${name}!`;
    userGreeting.style.opacity = '1';
}
