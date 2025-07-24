function createHearts() {
  // Falling heart from center-right
  const fallingHeart = document.createElement('div');
  fallingHeart.classList.add('heart', 'falling-heart');
  fallingHeart.innerHTML = '🤎';
  fallingHeart.style.left = 'calc(50% + 40px)';
  document.querySelector('.hearts-container').appendChild(fallingHeart);

  // Rising heart from center-left
  const risingHeart = document.createElement('div');
  risingHeart.classList.add('heart', 'rising-heart');
  risingHeart.innerHTML = '🤎';
  risingHeart.style.left = 'calc(50% - 40px)';
  document.querySelector('.hearts-container').appendChild(risingHeart);

  // Remove both after animation
  setTimeout(() => {
    fallingHeart.remove();
    risingHeart.remove();
  }, 5000);
}

// Run every 1.2 seconds
setInterval(createHearts, 1200);

let token = "";

// Step 1: Get Spotify Access Token (client credentials)
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

getSpotifyToken(); // Run at page load

async function searchSpotifyTrack() {
  const query = document.getElementById("spotifySearch").value;
  const resultsDiv = document.getElementById("spotifyResults");

  if (!query || query.length < 2) {
    resultsDiv.innerHTML = "";
    return;
  }

  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=5`,
    {
      headers: {
        Authorization: "Bearer " + token,
      },
    }
  );

  const data = await response.json();
  const tracks = data.tracks.items;

  resultsDiv.innerHTML = "";
  tracks.forEach((track) => {
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

      // Embed player
      const embedContainer = document.getElementById("spotifyEmbed");
      embedContainer.innerHTML = `
        <iframe style="border-radius:12px" 
          src="https://open.spotify.com/embed/track/${track.id}?utm_source=generator&theme=0" 
          width="100%" height="80" frameBorder="0" 
          allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture" 
          loading="lazy">
        </iframe>`;
    };

    resultsDiv.appendChild(div);
  });
}
document.querySelector(".confess-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const confessionText = this.querySelector("textarea").value.trim();
  const songLink = document.getElementById("selectedTrack").value;

  if (!confessionText) return;

  const entry = {
    message: confessionText,
    song: songLink,
    time: new Date().toLocaleString()
  };

  // Save to localStorage
  let confessions = JSON.parse(localStorage.getItem("confessions")) || [];
  confessions.push(entry);
  localStorage.setItem("confessions", JSON.stringify(confessions));

  this.reset(); // clear form
  document.getElementById("spotifyEmbed").innerHTML = "";

  displayMessages(); // update messages page
  document.getElementById("messagesPage").scrollIntoView({ behavior: "smooth" });
});
function displayMessages() {
  const messagesList = document.getElementById("messagesList");
  messagesList.innerHTML = "";

  const confessions = JSON.parse(localStorage.getItem("confessions")) || [];

  confessions.forEach((entry) => {
    const card = document.createElement("div");
    card.className = "message-card";

    card.innerHTML = `
      <p>${entry.message}</p>
      ${entry.song ? `
        <div class="spotify-embed">
          <iframe style="border-radius:12px"
            src="https://open.spotify.com/embed/track/${extractSpotifyID(entry.song)}?utm_source=generator&theme=0"
            width="100%" height="80" frameborder="0"
            allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
            loading="lazy">
          </iframe>
        </div>
      ` : ""}
      <small style="display:block; margin-top:10px; color:#888;">🕒 ${entry.time}</small>
    `;
    messagesList.appendChild(card);
  });
}

// Helper function to extract track ID from Spotify URL
function extractSpotifyID(url) {
  const match = url.match(/track\/([a-zA-Z0-9]+)/);
  return match ? match[1] : "";
}
window.addEventListener("DOMContentLoaded", displayMessages);

