import axios from 'axios';

const api = axios.create({
  baseURL: '/api/auth',
  headers: { 'Content-Type': 'application/json' }
});

const playlistApi = axios.create({
  baseURL: '/api/playlist',
  headers: { 'Content-Type': 'application/json' }
});

const uploadApi = axios.create({
  baseURL: '/api/playlist'
});

export const authAPI = {
  login: (email, password) => api.post('/login', { email, password }),
  register: (data) => api.post('/register', data),
  getUser: (userId) => api.get(`/user/${userId}`),
  updateUsername: (userId, fullName) => api.put('/update-username', { userId, fullName }),
  changePassword: (userId, currentPassword, newPassword, confirmPassword) =>
    api.put('/change-password', { userId, currentPassword, newPassword, confirmPassword }),
  changeEmail: (userId, newEmail, password) =>
    api.put('/change-email', { userId, newEmail, password }),
  deleteAccount: (userId, password) =>
    api.delete('/delete-account', { data: { userId, password } }),
  forgotPassword: (email) => api.post('/forgot-password', { email }),
  resetPassword: (token, newPassword, confirmPassword) =>
    api.post('/reset-password', { token, newPassword, confirmPassword }),
  getSecurityQuestions: (email) => api.post('/get-security-questions', { email }),
  verifySecurity: (email, petName, favoriteColor) =>
    api.post('/verify-security', { email, petName, favoriteColor }),
  sendOtp: (email) => api.post('/send-otp', { email }),
  verifyOtp: (email, otp) => api.post('/verify-otp', { email, otp }),
  resetWithOtp: (email, otp, newPassword, confirmPassword) =>
    api.post('/reset-with-otp', { email, otp, newPassword, confirmPassword })
};

export const playlistAPI = {
  getGlobalPlaylists: () => playlistApi.get('/global'),

  adminCreate: (data) => playlistApi.post('/admin-create', data),
  adminDelete: (data) => playlistApi.post('/admin-delete', data),
  adminAddSong: (formData) => uploadApi.post('/admin-add-song', formData),
  adminAddSongUrl: (data) => playlistApi.post('/admin-add-song-url', data),
  adminRemoveSong: (data) => playlistApi.post('/admin-remove-song', data),
  uploadCover: (formData) => uploadApi.post('/upload-cover', formData),
  uploadSongImage: (formData) => uploadApi.post('/upload-song-image', formData),
  copyCoverPath: (data) => playlistApi.post('/copy-cover-path', data),
  copyFromPath: (data) => playlistApi.post('/copy-from-path', data),

  userCreate: (data) => playlistApi.post('/user-create', data),
  userDelete: (data) => playlistApi.post('/user-delete', data),
  getUserPlaylists: (userId) => playlistApi.get(`/user-playlists/${userId}`),
  userAddSong: (data) => playlistApi.post('/user-add-song', data),
  userRemoveSong: (data) => playlistApi.post('/user-remove-song', data),
};
