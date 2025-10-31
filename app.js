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

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const allData = new Map();

// ====================================
// 2. دوال معالجة البيانات 
// (هذا القسم فارغ كما كان سابقاً)
// ====================================

// ====================================
// 3. دوال بناء عناصر الواجهة
// ====================================

/** ينشئ العنصر النائب للفيديو (Shimmer Loading) */
function createVideoElement() {
  const el = document.createElement("div");
  el.className = "video";
  el.innerHTML = `
    <a href="video.html?id=loading">
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

/** دالة تحديث عنصر الفيديو بالبيانات الحقيقية (بما في ذلك رابط صفحة الفيديو المنفردة) */
async function upgradeVideoElement(videoDiv, info) {
  if (!info || !info.videoId) {
    videoDiv.remove(); 
    return;
  }
  
  // 1. التحقق القسري:
  const isVideoDataMissing = 
      !info.title || info.title.trim() === '' || 
      !info.channelTitle || info.channelTitle.trim() === '' || 
      !info.channelThumb || info.channelThumb.trim() === ''; 

  if (isVideoDataMissing) {
    videoDiv.remove(); 
    return; 
  }
  
  // 2. إذا كانت البيانات متوفرة، يتم عرض الفيديو بشكل طبيعي
  const displayThumbUrl = `https://img.youtube.com/vi/${info.videoId}/hqdefault.jpg`;
  const channelTitle = info.channelTitle; 
  
  videoDiv.innerHTML = `
    <a href="video.html?id=${info.videoId}"> 
      <div class="video-thumb-wrapper">
        <img src="${displayThumbUrl}"
             class="video-thumb" 
             alt="${info.title} - ${channelTitle}"> 
      </div>
    </a>
    <div class="video-info">
      <a href="${info.channelUrl || '#'}" target="_blank">
        <img src="${info.channelThumb}" class="channel-thumb" alt="${channelTitle}">
      </a>
      <div class="video-title-box">
        <div class="video-title-row">
          <h3 class="video-title">${info.title}</h3> </div>
        <div style="font-size: 0.75rem; color: #aaa;">${channelTitle}</div>
      </div>
    </div>`;
}

// ====================================
// 4. دوال التحكم والتحميل الرئيسية
// ====================================

/** دالة مُعدّلة لإنشاء صف أفقي كبير لجميع الفيديوهات، ليتم التحكم به عبر CSS */
function renderAllVideosRandomly() {
  // 1. إزالة جميع الأقسام (Sections) الحالية
  document.querySelectorAll('.section').forEach(s => s.remove());
  
  // 2. تجميع كل الفيديوهات في مصفوفة واحدة
  let allVideos = [];
  for (const videos of allData.values()) {
    allVideos.push(...videos);
  }
  
  // 3. التحقق والتوقف إذا لم توجد فيديوهات
  if (allVideos.length === 0) {
      // لا تفعل أي شيء، فقط انتظر إخفاء شاشة التحميل في loadVideos
      return;
  }
  
  // 4. خلط الفيديوهات عشوائياً
  const elementsToRender = allVideos.sort(() => Math.random() - 0.5);

  // 5. إنشاء حاوية Section وحاوية Video-Row 
  const container = document.createElement("div");
  container.className = "section all-videos-section"; 
  
  const row = document.createElement("div");
  row.className = "video-row";

  
  // 6. إضافة الفيديوهات إلى الصف
  elementsToRender.forEach(info => {
      const videoEl = createVideoElement();
      row.appendChild(videoEl); 

      // تطبيق Intersection Observer (الـ Lazy Loading)
      const observer = new IntersectionObserver(async (entries, obs) => {
          for (const entry of entries) {
              if (entry.isIntersecting) {
                  await upgradeVideoElement(videoEl, info); 
                  obs.unobserve(entry.target);
              }
          }
      }, { rootMargin: "200px" });
      observer.observe(videoEl);
  });

  // 7. عرض الحاوية الموحدة في الواجهة
  container.appendChild(row);
  document.querySelector("main").appendChild(container);
  
    // إخفاء شاشة التحميل بعد الانتهاء
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
        if (window.loaderInterval) {
            clearInterval(window.loaderInterval);
        }
    }
}


function loadVideos() {
  onValue(ref(db, 'videos'), snapshot => {
    const data = snapshot.val() || {};
    allData.clear();
    
    for (const key in data) {
      const item = data[key];
      
      if (!item.section || !item.videoId) continue; 
      
      if (!allData.has(item.section)) {
        allData.set(item.section, []);
      }
      allData.get(item.section).push(item);
    }
    
    // 🚨 الحل هنا: استدعاء الدالة المسؤولة عن العرض
    renderAllVideosRandomly();
  });
}

loadVideos();
