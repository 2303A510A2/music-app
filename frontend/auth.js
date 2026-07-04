// Frontend authentication helper functions

const API_ROOT = 'http://localhost:5000';
const API_BASE_URL = `${API_ROOT}/api/auth`;

// Store user data in localStorage
function setUserData(userData) {
    localStorage.setItem('userId', userData.userId);
    localStorage.setItem('fullName', userData.fullName);
    localStorage.setItem('email', userData.email);
}

// Get user data from localStorage
function getUserData() {
    return {
        userId: localStorage.getItem('userId'),
        fullName: localStorage.getItem('fullName'),
        email: localStorage.getItem('email')
    };
}

// Clear user data from localStorage
function clearUserData() {
    localStorage.removeItem('userId');
    localStorage.removeItem('fullName');
    localStorage.removeItem('email');
}

// Check if user is logged in
function isLoggedIn() {
    return localStorage.getItem('userId') !== null;
}

// Fetch user profile
async function getUserProfile(userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/user/${userId}`);
        if (response.ok) {
            return await response.json();
        }
        return null;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
}

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        setUserData,
        getUserData,
        clearUserData,
        isLoggedIn,
        getUserProfile
    };
}
