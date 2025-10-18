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
// 2. دوال بناء عناصر الواجهة
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

/** ينشئ عنصر إعلان Native Banner حقيقي */
function createAdPlaceholder() {
  const adContainer = document.createElement('div');
  adContainer.className = "ad-box"; // احتفظ بالكلاس لتطبيق تنسيق الصفوف

  // 💡 هنا يتم وضع كود عرض الإعلان Native Banner الحقيقي
  // data-zone 10054500 مأخوذ من ملف Native ad.txt
  adContainer.innerHTML = `
    <div class="monetag-native-ad" data-zone="10054500" style="width: 100%;"></div>
  `;
  return adContainer;
}

/** يحدّث عنصر الفيديو بالبيانات المخزنة في Firebase */
async function upgradeVideoElement(videoDiv, info) {
// ... (بقية الكود لم يتغير)
  if (!info || !info.videoId) return;

  videoDiv.innerHTML = `
    <a href="#" onclick="handleVideoClick('https://www.youtube.com/watch?v=${info.videoId}', event)">
      <div class="video-thumb-wrapper">
        <div class="video-thumb" style="background-image: url('https://img.youtube.com/vi/${info.videoId}/hqdefault.jpg');"></div>
      </div>
    </a>
    <div class="video-info">
      <a href="${info.channelUrl || '#'}" target="_blank">
        <img src="${info.channelThumb || ''}" class="channel-thumb" alt="${info.channelTitle || ''}">
      </a>
      <div class="video-title-box">
        <div class="video-title-row">
          <div class="video-title">${info.title || 'عنوان غير متوفر'}</div>
        </div>
        <div style="font-size: 0.75rem; color: #aaa;">${info.channelTitle || 'قناة غير متوفرة'}</div>
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
      // ⚠️ فحص البيانات: لا نعرض الفيديوهات التي لا تحتوي على بيانات القناة (لأنها قديمة)
      if (!info.channelTitle) continue;

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

      // 2. إدراج مكان إعلان البانر (Placeholder) - تم التعديل هنا ليكون عشوائياً
      // بدلاً من الظهور الثابت كل 4 فيديوهات، سيظهر الإعلان بفرصة 25% (عشوائي)
      if (Math.random() < 0.25) { 
          row.appendChild(createAdPlaceholder());
      }
  }

  container.appendChild(title);
  container.appendChild(row);
  document.querySelector("main").appendChild(container);
}

// ====================================
// 3. دوال التحكم والتحميل الرئيسية
// ====================================

function renderAllSections() {
// ... (بقية الكود لم يتغير)
  for (const [sectionName, videos] of allData.entries()) {
    if (!renderedSections.has(sectionName)) {
      createSection(sectionName, videos);
      renderedSections.add(sectionName);
    }
  }
}

function loadVideos() {
// ... (بقية الكود لم يتغير)
  onValue(ref(db, 'videos'), snapshot => {
    const data = snapshot.val() || {};
    // 💡 الآن نحفظ الكائن كاملاً (بما فيه العنوان والأيقونة)
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
  window.location.href = url;
}

window.handleVideoClick = handleVideoClick;
window.addEventListener("DOMContentLoaded", loadVideos);
