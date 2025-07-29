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

// 🔐 SPOTIFY
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

// ✅ FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

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
const confessionsRef = ref(db, "confessions");

function extractSpotifyID(url) {
  const match = url.match(/track\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

function loadConfessions() {
  const track = document.querySelector(".message-track");

  onValue(confessionsRef, (snapshot) => {
    track.innerHTML = "";

    const data = snapshot.val();
    if (data) {
      const reversed = Object.values(data).reverse();

      reversed.forEach(entry => {
        const scrollCard = createScrollingCard(entry.message, entry.song);
        track.appendChild(scrollCard);
      });

      reversed.forEach(entry => {
        const cloneCard = createScrollingCard(entry.message, entry.song);
        track.appendChild(cloneCard);
      });
    }
  });
}

function animateCount(targetCount) {
  const counter = document.getElementById("confessionCount");
  let current = parseInt(counter.textContent) || 0;

  const step = () => {
    current += Math.ceil((targetCount - current) / 12);
    if (current >= targetCount) {
      counter.textContent = targetCount;
    } else {
      counter.textContent = current;
      requestAnimationFrame(step);
    }
  };

  requestAnimationFrame(step);
}

onValue(confessionsRef, (snapshot) => {
  const count = snapshot.size || Object.keys(snapshot.val() || {}).length;
  animateCount(count);
});

window.addEventListener('DOMContentLoaded', () => {
  loadConfessions();
  document.getElementById("spotifySearch").addEventListener("input", searchSpotifyTrack);
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
  });

  fetch('./navbar.html')
    .then(response => response.text())
    .then(html => {
      const temp = document.createElement('div');
      temp.innerHTML = html;
      const nav = temp.querySelector('nav');
      if (nav) {
        document.getElementById('navbar').appendChild(nav);
        console.log('✅ Navbar fetched and inserted');
      } else {
        console.warn('⚠️ No <nav> tag found in navbar.html');
      }
    })
    .catch(error => {
      console.error('❌ Failed to load navbar:', error);
    });

  fetch('./footer.html')
    .then(response => response.text())
    .then(html => {
      const temp = document.createElement('div');
      temp.innerHTML = html;
      const footer = temp.querySelector('footer');
      if (footer) {
        document.getElementById('footer').appendChild(footer);
        console.log('✅ Footer fetched and inserted');
      } else {
        console.warn('⚠️ No <footer> tag found in footer.html');
      }
    })
    .catch(error => {
      console.error('❌ Failed to load footer:', error);
    });
});

function createScrollingCard(message, songURL) {
  const card = document.createElement('div');
  card.className = 'message-card';
  const songID = extractSpotifyID(songURL);

  card.innerHTML = `
    <div class="top-bar">
      <span class="logo">ConfessMo.</span>
    </div>
    <div class="message">"${message}"</div>
    ${songID ? `
      <div class="spotify-embed">
        <iframe src="https://open.spotify.com/embed/track/${songID}" width="100%" height="80" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen" loading="lazy"></iframe>
      </div>` : ""}
    <div class="signature">Made with 🤎 by ConfessMo.</div>
  `;
  return card;
}
