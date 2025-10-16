import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// =====================================
// 1. إعدادات وقيم ثابتة
// =====================================
const firebaseConfig = {
  apiKey: "AIzaSyDzoEzH1W6Z1lncab5Se8PObYFp6060oTk",
  authDomain: "levelup-d5f5c.firebaseapp.com",
  databaseURL: "https://levelup-d5f5c-default-rtdb.firebaseio.com/",
  projectId: "levelup-d5f5c",
  storageBucket: "levelup-d5f5c.appspot.com",
  messagingSenderId: "189128717624",
  appId: "1:189128717624:web:5a36bb4393eef1dca17dcd"
};

const AD_INSERTION_INTERVAL = 4;

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const allData = new Map();
const renderedSections = new Set();


// =====================================
// 2. دوال معالجة البيانات
// =====================================

async function fetchVideoDetails(videoId) {
    const YOUTUBE_API_KEY = "AIzaSyAeZ8GxeJ04NjKGFx7ABeq8khEkdAnvuVk"; 
    
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`;
    
    const response = await fetch(url);

    if (!response.ok) {
        console.error("فشل جلب تفاصيل الفيديو من يوتيوب. تحقق من المفتاح أو القيود.");
        return null;
    }

    const data = await response.json();
    
    if (data && data.items && data.items.length > 0) {
        return data.items[0].snippet; 
    }
    
    return null; 
}


// =====================================
// 3. دوال إنشاء العناصر
// =====================================

function createAdPlaceholder() {
  const adPlaceholder = document.createElement("div");
  adPlaceholder.className = "video-container";
  adPlaceholder.innerHTML = `
      <div class="video-thumb ad-placeholder" style="display:flex; flex-direction:column; justify-content:center; align-items:center; background-color:#1a1a1a; cursor:default; height:150px;">
          <h3 style="color:#0ff; margin-bottom: 5px;">مساحة إعلانية</h3>
          <p style="color:#aaa; font-size:12px;">انقر في أي مكان للمتابعة</p>
          <script async="async" data-cfasync="false" src="https://groleegni.net/d.js?id=10016668"></script>
      </div>
  `;
  return adPlaceholder;
}

function createVideoElement(sectionName, videoId, videoSnippet) {
  const videoTitle = videoSnippet.title;
  const channelTitle = videoSnippet.channelTitle;
  const thumbnailUrl = videoSnippet.thumbnails.medium.url;

  const videoEl = document.createElement("div");
  videoEl.className = "video-container";
  videoEl.onclick = () => handleVideoClick(sectionName, videoId);
  videoEl.innerHTML = `
      <div class="video-thumb" data-videoid="${videoId}" data-thumbnailurl="${thumbnailUrl}" style="background-image:url('placeholder-image-url.png');">
          <div class="video-overlay">
              <h4 class="video-title">${videoTitle}</h4>
              <p class="channel-title">${channelTitle}</p>
          </div>
      </div>
  `;
  
  const observer = new IntersectionObserver(async (entries, obs) => {
      if (entries[0].isIntersecting) {
          const target = entries[0].target;
          const videoId = target.dataset.videoid;

          const thumbEl = target.querySelector(".video-thumb");
          if (thumbEl) {
              const thumbnailUrl = thumbEl.dataset.thumbnailurl;
              thumbEl.style.backgroundImage = `url('${thumbnailUrl}')`; 
              obs.unobserve(entries[0].target);
          }
      }
  }, { rootMargin: "200px" });
  observer.observe(videoEl);
  
  return videoEl;
}

function createSection(titleText, videos) {
  const container = document.createElement("section");
  const title = document.createElement("h2");
  title.textContent = titleText;

  const row = document.createElement("div");
  row.className = "video-row";

  let videoIndex = 0;
  for (const video of videos) {
      const videoEl = createVideoElement(titleText, video.videoId, video.snippet);
      row.appendChild(videoEl);

      videoIndex++;

      if (videoIndex % AD_INSERTION_INTERVAL === 0) {
          row.appendChild(createAdPlaceholder());
      }
  }

  container.appendChild(title);
  container.appendChild(row);
  document.querySelector("main").appendChild(container);
}

// ====================================
// 4. دوال التحكم والتحميل الرئيسية
// ====================================

function renderAllSections() {
  for (const [sectionName, videos] of allData.entries()) {
    if (!renderedSections.has(sectionName)) {
      createSection(sectionName, videos);
      renderedSections.add(sectionName);
    }
  }
}

function loadVideos() {
  onValue(ref(db, 'videos'), snapshot => {
    const data = snapshot.val() || {};
    for (const key in data) {
      const item = data[key];
      if (!item.section || !item.videoId) continue;
      if (!allData.has(item.section)) {
        allData.set(item.section, []);
      }
      allData.get(item.section).push({ videoId: item.videoId });
    }
    renderAllSections();
  });
}

function handleVideoClick(sectionName, videoId) {
    const url = `https://www.youtube.com/watch?v=${videoId}`;
    window.open(url, '_blank'); 
}

// =====================================
// 5. تهيئة التطبيق
// =====================================

document.addEventListener("DOMContentLoaded", () => {
  loadVideos();
});
