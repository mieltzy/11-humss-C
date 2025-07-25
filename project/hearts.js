// 🎈 HEART ANIMATION
function createHearts() {
  const container = document.querySelector('.hearts-container');

  const fallingHeart = document.createElement('div');
  fallingHeart.classList.add('heart', 'falling-heart');
  fallingHeart.innerHTML = '🤎';
  fallingHeart.style.left = 'calc(50% + 40px)';
  container.appendChild(fallingHeart);

  const risingHeart = document.createElement('div');
  risingHeart.classList.add('heart', 'rising-heart');
  risingHeart.innerHTML = '🤎';
  risingHeart.style.left = 'calc(50% - 40px)';
  container.appendChild(risingHeart);

  setTimeout(() => {
    fallingHeart.remove();
    risingHeart.remove();
  }, 5000);
}
setInterval(createHearts, 1200);

// 🎵 SPOTIFY INTEGRATION
let token = "";

async function getSpotifyToken() {
  const client_id = "5f66fa55d9f140d29d14ea5802f7d409";
  const client_secret = "b8a13c94d62b4287998af0d4beb6f512";

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(client_id + ":" + client_secret),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  token = data.access_token;
}

async function searchSpotifyTrack() {
  const query = document.getElementById("spotifySearch").value;
  const resultsDiv = document.getElementById("spotifyResults");

  if (!query || query.length < 2) {
    resultsDiv.innerHTML = "";
    return;
  }

  if (!token) await getSpotifyToken();

  try {
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`,
      { headers: { Authorization: "Bearer " + token } }
    );

    const data = await response.json();

    if (!data.tracks || !Array.isArray(data.tracks.items)) {
      resultsDiv.innerHTML = `<div class="error">No results or invalid token</div>`;
      return;
    }

    resultsDiv.innerHTML = "";
    data.tracks.items.forEach((track) => {
      const div = document.createElement("div");
      div.className = "spotify-result";
      div.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          <img src="${track.album.images[2]?.url}" width="50" height="50" style="border-radius: 6px;">
          <div>
            <strong>${track.name}</strong><br>
            <small>${track.artists[0].name}</small>
          </div>
        </div>
      `;

      div.onclick = () => {
        document.getElementById("spotifySearch").value = `${track.name} - ${track.artists[0].name}`;
        document.getElementById("selectedTrack").value = track.external_urls.spotify;
        resultsDiv.innerHTML = "";

        document.getElementById("spotifyEmbed").innerHTML = `
          <iframe style="border-radius:12px" 
            src="https://open.spotify.com/embed/track/${track.id}?utm_source=generator&theme=0" 
            width="100%" height="80" frameBorder="0" 
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture" 
            loading="lazy">
          </iframe>`;
      };

      resultsDiv.appendChild(div);
    });

  } catch (error) {
    console.error("searchSpotifyTrack error:", error);
    resultsDiv.innerHTML = `<div class="error">Failed to search Spotify</div>`;
  }
}

// ✅ FIREBASE IMPORTS
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ✅ FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyCdKSva31GhGNYof_cC0ApGOhBLIO1rEZ0",
  authDomain: "confessmo-a877a.firebaseapp.com",
  databaseURL: "https://confessmo-a877a-default-rtdb.firebaseio.com",
  projectId: "confessmo-a877a",
  storageBucket: "confessmo-a877a.appspot.com",
  messagingSenderId: "903118394780",
  appId: "1:903118394780:web:0e81f2bf44b3abd12d6459"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ✉️ CONFESSION SUBMIT (Firebase only)
document.querySelector(".confess-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const message = this.querySelector("textarea").value.trim();
  const song = document.getElementById("selectedTrack").value;

  if (!message) return;

  const entry = {
    message,
    song,
    time: new Date().toLocaleString()
  };

  await push(ref(db, "confessions"), entry);

  alert("Confession sent successfully!");
  this.reset();
  document.getElementById("spotifyEmbed").innerHTML = "";
  document.getElementById("messagesPage")?.scrollIntoView({ behavior: "smooth" });
});

// 📥 FETCH FROM FIREBASE
function loadConfessions() {
  const list = document.getElementById("messagesList");
  const confessRef = ref(db, "confessions");

  onValue(confessRef, (snapshot) => {
    list.innerHTML = "";
    const data = snapshot.val();
    if (data) {
      Object.values(data).reverse().forEach(entry => {
        const card = document.createElement("div");
        card.className = "message-card";

        card.innerHTML = `
          <p>${entry.message}</p>
          ${entry.song ? `
            <div class="spotify-embed">
              <iframe style="border-radius:12px"
                src="https://open.spotify.com/embed/track/${extractSpotifyID(entry.song)}?utm_source=generator&theme=0"
                width="100%" height="80" frameborder="0"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                loading="lazy">
              </iframe>` : ""}
          <small style="display:block; margin-top:10px; color:#888;">🕒 ${entry.time}</small>
        `;
        list.appendChild(card);
      });
    }
  });
}

function extractSpotifyID(url) {
  const match = url.match(/track\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

// ⏬ Load messages on page load
window.addEventListener("DOMContentLoaded", loadConfessions);
document.getElementById("spotifySearch").addEventListener("input", searchSpotifyTrack);