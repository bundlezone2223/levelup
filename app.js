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
const renderedSections = new Set();

// ====================================
// 2. دوال بناء عناصر الواجهة (الحل القاطع لـ SEO)
// ====================================

/** 🚨 الوظيفة: ينشئ عنصر الفيديو النهائي (القابل للفهرسة) */
function createFinalVideoElement(info) {
  // 1. التحقق القسري: إذا كانت البيانات مفقودة أو غير صالحة، لا ننشئ العنصر.
  const isVideoDataMissing = 
      !info || !info.videoId || 
      !info.title || info.title.trim() === '' || 
      !info.channelTitle || info.channelTitle.trim() === '' || 
      !info.channelThumb || info.channelThumb.trim() === ''; 

  if (isVideoDataMissing) {
    return null; 
  }
  
  // 2. إذا كانت البيانات متوفرة، يتم بناء عنصر الفيديو النهائي بالكامل
  const videoDiv = document.createElement("div");
  videoDiv.className = "video";
  
  // استخدام صورة عالية الجودة (hqdefault) لتقليل حجم التحميل الأولي
  const displayThumbUrl = `https://img.youtube.com/vi/${info.videoId}/hqdefault.jpg`;
  const channelTitle = info.channelTitle; 
  const videoUrl = `https://www.youtube.com/watch?v=${info.videoId}`;
  
  videoDiv.innerHTML = `
    <a href="${videoUrl}" target="_blank" onclick="handleVideoClick('${videoUrl}', event)">
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
    
    return videoDiv;
}


/** ينشئ قسم (Section) الفيديوهات */
function createSection(sectionName, videos) {
  const container = document.createElement("div");
  container.className = "section";
  container.setAttribute("data-section", sectionName);

  const title = document.createElement("h2"); 
  title.className = "section-title";
  title.textContent = sectionName;

  const row = document.createElement("div");
  row.className = "video-row";
  
  // خلط قائمة الفيديوهات الأساسية
  const elementsToRender = [...videos].sort(() => Math.random() - 0.5);
  
  let videoCount = 0;

  elementsToRender.forEach(info => {
      // 🚨 الحل القاطع للفهرسة: إنشاء عنصر الفيديو النهائي مباشرةً دون Observer
      const videoEl = createFinalVideoElement(info);
      
      if (videoEl) {
          row.appendChild(videoEl);
          videoCount++;
      }
  });

  if (videoCount === 0) {
      return null;
  }

  container.appendChild(title);
  container.appendChild(row);
  document.querySelector("main").appendChild(container);

  return container; 
}

// ====================================
// 3. دوال التحكم والتحميل الرئيسية
// ====================================

/** 🚨 تم التعديل: إخفاء اللودر فور ظهور أول محتوى */
function renderAllSections() {
  document.querySelectorAll('.section').forEach(s => s.remove());
  renderedSections.clear();
  
  let contentRendered = false; 

  for (const [sectionName, videos] of allData.entries()) {
    if (videos.length > 0 && !renderedSections.has(sectionName)) {
      const sectionEl = createSection(sectionName, videos);
      if (sectionEl) {
        renderedSections.add(sectionName);
        contentRendered = true; 
      }
    }
  }

  // 💡 إخفاء اللودر بمجرد الانتهاء من رسم الأقسام بالمحتوى القابل للفهرسة
  if (contentRendered) {
      const loadingScreen = document.getElementById("loading-screen");
      if (loadingScreen) {
          loadingScreen.style.display = "none";
          // 🚨 إيقاف الـ setInterval باستخدام window.loaderInterval الذي تم تعريفه في index.html
          if (window.loaderInterval) {
              clearInterval(window.loaderInterval);
          }
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
    renderAllSections(); 
  });
}

/** دالة نقرة الفيديو: تركناها لكننا نعتمد على الرابط في HTML للفهرسة */
function handleVideoClick(url, event) {
  // بما أن الرابط في HTML أصبح target="_blank"، لا حاجة لـ event.preventDefault() هنا
}

window.handleVideoClick = handleVideoClick;

// يتم تشغيل الدالة مباشرة
loadVideos();
