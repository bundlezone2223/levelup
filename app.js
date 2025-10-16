import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ====================================
// 1. إعدادات وقيم ثابتة
// ====================================
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

// ====================================
// 2. دوال معالجة البيانات
// ====================================

/** يجلب معلومات الفيديو من YouTube API (بطلب واحد فقط) */
async function getVideoData(videoId) {
  // المفتاح السري المقيد
  const YOUTUBE_API_KEY = "AIzaSyAeZ8GxeJ04NjKGFx7ABeq8khEkdAnvuVk"; 
  
  try {
    // نطلب فقط بيانات الفيديو (videos?part=snippet)
    const res = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${YOUTUBE_API_KEY}`);
    if (!res.ok) {
        console.error("فشل طلب يوتيوب. تحقق من المفتاح والقيود.");
        return null;
    }
    const data = await res.json();
    const snippet = data.items?.[0]?.snippet;
    if (!snippet) return null;

    // نمرر البيانات المتاحة
    return {
      title: snippet.title,
      channelTitle: snippet.channelTitle,
      channelThumb: "", // تم تركها فارغة لتجنب الطلب الثاني
      channelUrl: `https://www.youtube.com/channel/${snippet.channelId}`
    };
  } catch(error) {
    console.error("حدث خطأ غير متوقع أثناء جلب بيانات يوتيوب:", error);
    return null;
  }
}

// ====================================
// 3. دوال بناء عناصر الواجهة
// ====================================

/** ينشئ العنصر النائب للفيديو (Shimmer Loading) */
function createVideoElement() {
  const el = document.createElement("div");
  el.className = "video";
  el.innerHTML = `
    <a href="#" onclick="event.preventDefault()">
      <div class="video-thumb-wrapper">
        <div class="video-thumb loading"></div>
      </div>
    </a>
    <div class="video-info">
      <div class="channel-thumb loading"></div>
      <div class="video-title-box">
        <div class="video-title-row">
          <div class="video-title loading"></div>
        </div>
        <div class="video-subtitle-placeholder loading" style="font-size: 0.75rem; color: #333;">&nbsp;</div>
      </div>
    </div>`;
  return el;
}

/** ينشئ عنصر إعلان بانر وهمي (Placeholder) */
function createAdPlaceholder() {
  const adContainer = document.createElement('div');
  adContainer.className = "ad-box";
  adContainer.innerHTML = `
    <div class="ad-container">
        <p style="color:#777; font-size:0.8rem; padding: 20px;">مكان إعلان البانر الجديد (PropellerAds Native Banner)</p>
    </div>
  `;
  return adContainer;
}

/** يحدّث عنصر الفيديو بالبيانات الحقيقية */
async function upgradeVideoElement(videoDiv, videoId) {
  const info = await getVideoData(videoId);
  if (!info) return;

  videoDiv.innerHTML = `
    <a href="#" onclick="handleVideoClick('https://www.youtube.com/watch?v=${videoId}', event)">
      <div class="video-thumb-wrapper">
        <div class="video-thumb" style="background-image: url('https://img.youtube.com/vi/${videoId}/hqdefault.jpg');"></div>
      </div>
    </a>
    <div class="video-info">
      <a href="${info.channelUrl}" target="_blank">
        <div class="channel-thumb" style="background-color: #333; border-radius: 50%;"></div> 
      </a>
      <div class="video-title-box">
        <div class="video-title-row">
          <div class="video-title">${info.title}</div>
        </div>
        <div style="font-size: 0.75rem; color: #aaa;">${info.channelTitle}</div>
      </div>
    </div>`;
}

/** ينشئ قسم (Section) الفيديوهات ويضيف مكان الإعلان */
function createSection(sectionName, videos) {
  const container = document.createElement("div");
  container.className = "section";
  container.setAttribute("data-section", sectionName);

  const title = document.createElement("div");
  title.className = "section-title";
  title.textContent = sectionName;

  const row = document.createElement("div");
  row.className = "video-row";
  
  const shuffledVideos = [...videos].sort(() => Math.random() - 0.5);
  
  let videoIndex = 0;
  for (const { videoId } of shuffledVideos) {
      // 1. إضافة الفيديو العادي
      const videoEl = createVideoElement();
      row.appendChild(videoEl);

      // استخدام IntersectionObserver لتحميل البيانات عند الاقتراب من الشاشة
      const observer = new IntersectionObserver(async (entries, obs) => {
          for (const entry of entries) {
              if (entry.isIntersecting) {
                  await upgradeVideoElement(videoEl, videoId);
                  obs.unobserve(entry.target);
              }
          }
      }, { rootMargin: "200px" });
      observer.observe(videoEl);

      videoIndex++;

      // 2. إدراج مكان إعلان البانر (Placeholder)
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

/** دالة نقرة الفيديو: توجيه مباشر وفوري */
function handleVideoClick(url, event) {
  event.preventDefault();
  window.location.href = url;
}

window.handleVideoClick = handleVideoClick;
window.addEventListener("DOMContentLoaded", loadVideos);
