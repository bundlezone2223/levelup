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

// ❌ تم إزالة YOUTUBE_API_KEY ودالة getVideoData
// 💡 الآن الموقع لا يستهلك حصة YouTube API! 
const AD_INSERTION_INTERVAL = 4;

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const allData = new Map();
const renderedSections = new Set();


// ====================================
// 2. دوال معالجة البيانات (تم إزالة دالة API)
// ====================================

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

/** يحدّث عنصر الفيديو بالبيانات المخزنة في Firebase */
async function upgradeVideoElement(videoDiv, info) {
  if (!info || !info.videoId) return;

  // التأكد من وجود عنوان القناة، وإلا استخدام عنوان احتياطي
  const channelTitle = info.channelTitle || 'قناة غير متوفرة';

  videoDiv.innerHTML = `
    <a href="#" onclick="handleVideoClick('https://www.youtube.com/watch?v=${info.videoId}', event)">
      <div class="video-thumb-wrapper">
        <div class="video-thumb" style="background-image: url('https://img.youtube.com/vi/${info.videoId}/hqdefault.jpg');"></div>
      </div>
    </a>
    <div class="video-info">
      <a href="${info.channelUrl || '#'}" target="_blank">
        <img src="${info.channelThumb || ''}" class="channel-thumb" alt="${channelTitle}">
      </a>
      <div class="video-title-box">
        <div class="video-title-row">
          <div class="video-title">${info.title || 'عنوان غير متوفر'}</div>
        </div>
        <div style="font-size: 0.75rem; color: #aaa;">${channelTitle}</div>
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
  for (const info of shuffledVideos) { // info هو الآن كائن البيانات الكامل من Firebase
      
      // 🚨 الحل الأخير: إزالة شرط الفلترة لمنع تجاهل الفيديوهات 
      // تم إزالة: if (!info.channelTitle) continue;

      // 1. إضافة الفيديو العادي
      const videoEl = createVideoElement();
      row.appendChild(videoEl);

      // استخدام IntersectionObserver لتحميل البيانات عند الاقتراب من الشاشة
      const observer = new IntersectionObserver(async (entries, obs) => {
          for (const entry of entries) {
              if (entry.isIntersecting) {
                  // 💡 الآن نستخدم info مباشرة
                  await upgradeVideoElement(videoEl, info); 
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
    // 💡 الآن نحفظ الكائن كاملاً وليس فقط videoId
    for (const key in data) {
      const item = data[key];
      if (!item.section || !item.videoId) continue;
      if (!allData.has(item.section)) {
        allData.set(item.section, []);
      }
      allData.get(item.section).push(item);
    }
    renderAllSections();
  });
}

/** دالة نقرة الفيديو: توجيه مباشر وفوري */
function handleVideoClick(url, event) {
  event.preventDefault();
  window.open(url, '_blank'); // تم التعديل ليفتح الرابط في نافذة جديدة كما هو شائع لمواقع الروابط
}

window.handleVideoClick = handleVideoClick;

// يتم تشغيل الدالة مباشرة لضمان تحميلها مع "module"
loadVideos();
