// spotifyService.js
// Service to handle Spotify PKCE Authorization and Web API calls.

const REDIRECT_URI = window.location.origin + '/';
const SCOPES = 'user-read-private playlist-modify-public playlist-modify-private';

// Helper: Generate random string for code verifier
function generateRandomString(length) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
}

// Helper: Sha256 hash of a string
async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
}

// Helper: Base64URL encode array buffer
function base64urlencode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

// 1. Redirect to Spotify Login using PKCE
export async function redirectToSpotifyAuthorize(clientId) {
  const codeVerifier = generateRandomString(64);
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64urlencode(hashed);

  window.localStorage.setItem('spotify_code_verifier', codeVerifier);
  window.localStorage.setItem('spotify_client_id', clientId);

  const authUrl = new URL('https://accounts.spotify.com/authorize');
  const params = {
    response_type: 'code',
    client_id: clientId,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
    redirect_uri: REDIRECT_URI,
  };

  authUrl.search = new URLSearchParams(params).toString();
  window.location.href = authUrl.toString(); // Redirect the user
}

// 2. Exchange authorization code for Access Token
export async function handleAuthorizationRedirect() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  if (!code) return null;

  const codeVerifier = window.localStorage.getItem('spotify_code_verifier');
  const clientId = window.localStorage.getItem('spotify_client_id');

  if (!codeVerifier || !clientId) {
    console.error('Missing code_verifier or client_id in localStorage');
    return null;
  }

  // Remove code from address bar immediately
  window.history.replaceState({}, document.title, window.location.pathname);

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
        code_verifier: codeVerifier,
      }),
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error_description || data.error);
    }

    // Save tokens and details
    saveTokenData(data);
    return data.access_token;
  } catch (error) {
    console.error('Error fetching Spotify access token:', error);
    return null;
  }
}

// Helper: Save token details with expiration timestamp
function saveTokenData(data) {
  const expiresAt = Date.now() + data.expires_in * 1000;
  window.localStorage.setItem('spotify_access_token', data.access_token);
  window.localStorage.setItem('spotify_refresh_token', data.refresh_token);
  window.localStorage.setItem('spotify_expires_at', expiresAt.toString());
}

// Get cached access token, automatically refreshing if expired
export async function getAccessToken() {
  const token = window.localStorage.getItem('spotify_access_token');
  const refreshToken = window.localStorage.getItem('spotify_refresh_token');
  const expiresAtStr = window.localStorage.getItem('spotify_expires_at');
  const clientId = window.localStorage.getItem('spotify_client_id');

  if (!token || !expiresAtStr || !clientId) return null;

  const expiresAt = parseInt(expiresAtStr, 10);
  // If token is expired or expires in less than 1 minute, refresh it
  if (Date.now() >= expiresAt - 60000) {
    if (!refreshToken) return null;
    return await refreshAccessToken(clientId, refreshToken);
  }

  return token;
}

// Refresh access token
async function refreshAccessToken(clientId, refreshToken) {
  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error_description || data.error);
    }

    saveTokenData(data);
    return data.access_token;
  } catch (error) {
    console.error('Error refreshing Spotify token:', error);
    // Clear credentials if refresh fails to force re-login
    logoutSpotify();
    return null;
  }
}

// Logout
export function logoutSpotify() {
  window.localStorage.removeItem('spotify_access_token');
  window.localStorage.removeItem('spotify_refresh_token');
  window.localStorage.removeItem('spotify_expires_at');
  window.localStorage.removeItem('spotify_code_verifier');
  // Note: We keep the client_id so the user doesn't have to retype it
}

// Get logged-in user profile details
export async function getSpotifyUserProfile() {
  const token = await getAccessToken();
  if (!token) return null;

  const response = await fetch('https://api.spotify.com/v1/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) return null;
  return await response.json();
}

// Search tracks on Spotify
export async function searchSpotifyTracks(query) {
  const token = await getAccessToken();
  if (!token) return [];

  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=25`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Spotify Search failed');
  }

  const data = await response.json();
  return data.tracks.items.map((item) => ({
    id: item.id,
    name: item.name,
    artist: item.artists.map((a) => a.name).join(', '),
    album: item.album.name,
    albumArt: item.album.images[0]?.url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80',
    audioUrl: item.preview_url, // 30-sec preview MP3 (Note: some tracks may have null preview)
    duration: Math.round(item.duration_ms / 1000),
    uri: item.uri, // Used for exporting to playlist
  }));
}

// Export playlist to Spotify
export async function exportPlaylistToSpotify(playlistName, trackUris) {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Spotify');

  // 1. Get user profile to retrieve user ID
  const profile = await getSpotifyUserProfile();
  if (!profile) throw new Error('Failed to retrieve user profile');
  const userId = profile.id;

  // 2. Create the playlist
  const createResponse = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: playlistName,
      description: 'Created using 30 Days Challenge - Playlist Builder App',
      public: false,
    }),
  });

  if (!createResponse.ok) {
    throw new Error('Failed to create Spotify playlist');
  }

  const playlistData = await createResponse.json();
  const playlistId = playlistData.id;

  // 3. Add tracks (Spotify supports max 100 per request, we can assume a smaller number or chunk if needed, let's chunk just in case)
  // Filtering out any tracks that do not have a Spotify URI (i.e. if sandbox tracks got mixed in)
  const validUris = trackUris.filter((uri) => uri && uri.startsWith('spotify:track:'));

  if (validUris.length === 0) {
    return playlistData; // Return playlist even if empty
  }

  const addTracksResponse = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      uris: validUris,
    }),
  });

  if (!addTracksResponse.ok) {
    throw new Error('Failed to add tracks to Spotify playlist');
  }

  return playlistData;
}
