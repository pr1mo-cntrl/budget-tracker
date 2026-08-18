// 1. Check who logged in
const currentUser = localStorage.getItem('activeUser');

// If no one is logged in, kick them back to the login page
if (!currentUser) {
    window.location.href = 'login.html';
}

// Greet the logged-in user
document.getElementById('greeting').innerText = `Welcome, ${currentUser}`;

// Initialize Appwrite
const { Client, Databases, ID, Query } = Appwrite;
const client = new Client();

client
    .setEndpoint('https://cloud.appwrite.io/v1') 
    .setProject('6a8439a3003002a2a730'); // Your Project ID

const databases = new Databases(client);

// Your Database and Table IDs
const DATABASE_ID = '6a843a9a002a47af924e'; 
const COLLECTION_ID = 'daily_ledger';      

// Global variable to keep track of total
let currentCycleTotal = 0;
// Monthly visual goal for the ring (e.g., 30 days * ₱20 = ₱600)
const MONTHLY_GOAL = 600; 

// Calculate the start date of the current cycle (the most recent 21st)
function getCycleStartDate() {
    const today = new Date();
    let year = today.getFullYear();
    let month = today.getMonth(); // 0-indexed (Jan = 0)
    const date = today.getDate();

    // If today is before the 21st, the cycle started last month
    if (date < 21) {
        month = month - 1;
        if (month < 0) {
            month = 11;
            year = year - 1;
        }
    }
    
    // Format to YYYY-MM-DD
    const paddedMonth = String(month + 1).padStart(2, '0');
    return `${year}-${paddedMonth}-21`;
}

// Fetch total savings for this cycle and update UI
async function loadDashboard() {
    const cycleStart = getCycleStartDate();
    
    try {
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_ID,
            [
                Query.greaterThanEqual('entry_date', cycleStart)
            ]
        );

        // Sum up all the amount_saved for the cycle
        currentCycleTotal = response.documents.reduce((sum, doc) => sum + doc.amount_saved, 0);
        updateGraphUI();

    } catch (error) {
        console.error("Error loading data:", error);
    }
}

// Update the circular graph and text
function updateGraphUI() {
    document.getElementById('savings-display').innerText = `₱${currentCycleTotal}`;
    
    // Calculate percentage for the ring (cap at 100%)
    let percentage = (currentCycleTotal / MONTHLY_GOAL) * 100;
    if (percentage > 100) percentage = 100;

    // Update the conic-gradient (white for progress, dark grey for empty)
    const circle = document.getElementById('progress-circle');
    circle.style.background = `conic-gradient(#ffffff ${percentage}%, #333333 ${percentage}%)`;
}

// Function to add 20 pesos when the button is clicked
async function addJointSavings() {
    const messageDiv = document.getElementById('message');
    const btn = document.getElementById('save-btn');
    
    // Disable button temporarily to prevent spam clicks
    btn.disabled = true;
    messageDiv.style.color = "#ffffff";
    messageDiv.innerText = "Saving...";

    const todayDate = new Date().toISOString().split('T')[0]; // Gets YYYY-MM-DD

    try {
        // Insert the 20 peso document into Appwrite
        await databases.createDocument(
            DATABASE_ID,
            COLLECTION_ID,
            ID.unique(), 
            {
                profile_name: currentUser,
                entry_date: todayDate,
                amount_spent: 0, // We are only tracking savings on this click
                amount_saved: 20
            }
        );

        // Instantly update the local total and graph without refreshing the page
        currentCycleTotal += 20;
        updateGraphUI();

        messageDiv.style.color = "#4caf50";
        messageDiv.innerText = "₱20 added to joint savings! 🎉";

    } catch (error) {
        messageDiv.style.color = "red";
        messageDiv.innerText = "Error saving data. Please try again.";
        console.error(error);
    } finally {
        // Re-enable the button after 2 seconds
        setTimeout(() => {
            btn.disabled = false;
            messageDiv.innerText = "";
        }, 2000);
    }
}

// Run this when the page loads
loadDashboard();