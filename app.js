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
// 2. دوال معالجة البيانات 
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

/** 🚨 الحل القاطع: التحقق من وجود عنوان الفيديو، اسم القناة، وصورة القناة */
async function upgradeVideoElement(videoDiv, info) {
  if (!info || !info.videoId) {
    videoDiv.remove(); 
    return;
  }
  
  // 1. التحقق القسري: إذا كان أي من هذه الحقول مفقوداً أو فارغاً، يتم حذف الفيديو.
  const isVideoDataMissing = 
      !info.title || info.title.trim() === '' || 
      !info.channelTitle || info.channelTitle.trim() === '' || 
      !info.channelThumb || info.channelThumb.trim() === ''; 

  if (isVideoDataMissing) {
    videoDiv.remove(); 
    
    // خطوة تنظيف إضافية: إزالة القسم إذا أصبح فارغاً
    const row = videoDiv.closest('.video-row');
    if (row) {
        setTimeout(() => {
            if (row.children.length === 0) {
                const section = row.closest('.section');
                if (section) section.remove();
            }
        }, 0);
    }
    return;
  }
  
  // 2. إذا كانت البيانات متوفرة، يتم عرض الفيديو بشكل طبيعي
  const displayThumbUrl = `https://img.youtube.com/vi/${info.videoId}/hqdefault.jpg`;
  const channelTitle = info.channelTitle; 
  
  videoDiv.innerHTML = `
    <a href="#" onclick="handleVideoClick('https://www.youtube.com/watch?v=${info.videoId}', event)">
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

/** ينشئ قسم (Section) الفيديوهات */
function createSection(sectionName, videos) {
  const container = document.createElement("div");
  container.className = "section";
  container.setAttribute("data-section", sectionName);

  const title = document.createElement("h2"); // 🚨 التعديل لتطبيق <h2> لـ SEO
  title.className = "section-title";
  title.textContent = sectionName;

  const row = document.createElement("div");
  row.className = "video-row";
  
  // خلط قائمة الفيديوهات الأساسية
  const elementsToRender = [...videos].sort(() => Math.random() - 0.5);
  
  elementsToRender.forEach(element => {
      // 1. إدراج عنصر الفيديو 
      const info = element;
      const videoEl = createVideoElement();
      row.appendChild(videoEl);

      // استخدام IntersectionObserver لتحميل بيانات الفيديو عند الاقتراب من الشاشة
      const observer = new IntersectionObserver(async (entries, obs) => {
          for (const entry of entries) {
              if (entry.isIntersecting) {
                  // هنا يتم التحقق من التوفر وإزالة العنصر إذا كان غير متاح
                  await upgradeVideoElement(videoEl, info); 
                  obs.unobserve(entry.target);
              }
          }
      }, { rootMargin: "200px" });
      observer.observe(videoEl);
      
  });


  container.appendChild(title);
  container.appendChild(row);
  document.querySelector("main").appendChild(container);
}

// ====================================
// 4. دوال التحكم والتحميل الرئيسية
// ====================================

function renderAllSections() {
  // نقوم بتنظيف جميع الأقسام المعروضة حالياً وإعادة إنشائها لضمان إزالة الأقسام الفارغة
  document.querySelectorAll('.section').forEach(s => s.remove());
  renderedSections.clear();
  
  for (const [sectionName, videos] of allData.entries()) {
    // شرط: لا نعرض القسم إذا لم يكن فيه فيديوهات متاحة في البداية
    if (videos.length > 0 && !renderedSections.has(sectionName)) {
      createSection(sectionName, videos);
      renderedSections.add(sectionName);
    }
  }
}

function loadVideos() {
  onValue(ref(db, 'videos'), snapshot => {
    const data = snapshot.val() || {};
    // تنظيف البيانات الحالية قبل الإضافة
    allData.clear();
    
    for (const key in data) {
      const item = data[key];
      
      // الشرط: تجاهل الفيديوهات التي لا تحتوي على قسم أو معرف فيديو
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
  window.open(url, '_blank'); 
}

window.handleVideoClick = handleVideoClick;

// يتم تشغيل الدالة مباشرة
loadVideos();
