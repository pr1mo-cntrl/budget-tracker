// 1. Check who logged in
const currentUser = localStorage.getItem('activeUser');

// 2. If no one is logged in, kick them back to the login page
if (!currentUser) {
    window.location.href = 'login.html';
}

// Initialize Appwrite
const { Client, Databases, ID } = Appwrite;
const client = new Client();

client
    .setEndpoint('https://cloud.appwrite.io/v1') 
    .setProject('sgp-6a8439a3003002a2a730'); // Your exact Project ID

const databases = new Databases(client);

// Your exact Database and Table IDs
const DATABASE_ID = '6a843a9a002a47af924e'; 
const COLLECTION_ID = 'daily_ledger';      

async function submitData() {
    // Get values from the form
    const profileElement = document.querySelector('input[name="profile"]:checked');
    const entryDate = document.getElementById('entry_date').value;
    const amountSpent = parseFloat(document.getElementById('amount_spent').value);
    const amountSaved = parseFloat(document.getElementById('amount_saved').value);
    const messageDiv = document.getElementById('message');

    // Validation
    if (!profileElement || !entryDate || isNaN(amountSpent) || isNaN(amountSaved)) {
        messageDiv.style.color = "red";
        messageDiv.innerText = "Please fill out all fields correctly.";
        return;
    }

    const profileName = profileElement.value;

    try {
        // Insert data into Appwrite
        const response = await databases.createDocument(
            DATABASE_ID,
            COLLECTION_ID,
            ID.unique(), 
            {
                profile_name: profileName,
                entry_date: entryDate,
                amount_spent: amountSpent,
                amount_saved: amountSaved
            }
        );

        // Evaluate the 20 pesos goal for you and Lisky
        if (amountSaved >= 20) {
            messageDiv.style.color = "#4caf50";
            messageDiv.innerText = "Success! ₱20 daily savings goal met! 🎉";
        } else {
            const shortfall = 20 - amountSaved;
            messageDiv.style.color = "#ff9800";
            messageDiv.innerText = `Log saved. You were ₱${shortfall} short of the ₱20 goal today.`;
        }
        
        // Clear inputs for the next entry
        document.getElementById('amount_spent').value = '';
        document.getElementById('amount_saved').value = '';

    } catch (error) {
        messageDiv.style.color = "red";
        messageDiv.innerText = "Error saving data: " + error.message;
        console.error(error);
    }
}