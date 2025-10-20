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

// 💡 النسبة المطلوبة للإعلان (12%)
const AD_PERCENTAGE = 0.12; 
const AD_ZONE_ID = '10054500';

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

/** 💡 تم التعديل: ينشئ عنصر إعلان Native Banner ويضمن تحميل السكريبت الإعلاني */
function createAdPlaceholder() {
  const adContainer = document.createElement('div');
  adContainer.className = "ad-box";
  
  // نضع الحاوية الأساسية للإعلان
  adContainer.innerHTML = `
    <div class="ad-container" style="display: block;">
        <div id="container-${AD_ZONE_ID}" class="native-ad-placeholder"></div>
    </div>
  `;
  
  // لضمان تحميل الإعلان داخل الحاوية الجديدة التي تم إنشاؤها عبر JavaScript،
  // يجب أن ننشئ سكريبت التشغيل ونضيفه بعد إضافة العنصر إلى DOM.
  // نستخدم setTimeout لضمان أن الحاوية قد تم إدراجها.
  
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        obs.unobserve(entry.target);
        
        const script = document.createElement('script');
        script.dataset.zone = AD_ZONE_ID;
        script.src = 'https://becorsolaom.com/tag.min.js';
        
        // نضيف السكريبت إلى عنصر الإعلان نفسه لضمان تنفيذه في السياق الصحيح
        entry.target.appendChild(script);
      }
    });
  }, { rootMargin: "0px" });

  observer.observe(adContainer);

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

/** ينشئ قسم (Section) الفيديوهات ويضيف مكان الإعلان بشكل عشوائي وبنسبة 12% */
function createSection(sectionName, videos) {
  const container = document.createElement("div");
  container.className = "section";
  container.setAttribute("data-section", sectionName);

  const title = document.createElement("div");
  title.className = "section-title";
  title.textContent = sectionName;

  const row = document.createElement("div");
  row.className = "video-row";
  
  // خلط قائمة الفيديوهات الأساسية
  const shuffledVideos = [...videos].sort(() => Math.random() - 0.5);
  
  // حساب عدد الإعلانات المطلوب إدراجها (12% من عدد الفيديوهات في القسم)
  const numAds = Math.floor(shuffledVideos.length * AD_PERCENTAGE); 
  
  // دمج الفيديوهات والإعلانات في قائمة واحدة
  let combinedElements = [...shuffledVideos];
  for (let i = 0; i < numAds; i++) {
    combinedElements.push('AD_PLACEHOLDER'); // استخدام دليل للإعلان
  }
  
  // خلط العناصر بالكامل لتوزيعها عشوائياً
  combinedElements.sort(() => Math.random() - 0.5);

  combinedElements.forEach(element => {
      if (element === 'AD_PLACEHOLDER') {
          // 1. إدراج عنصر الإعلان
          row.appendChild(createAdPlaceholder());
      } else {
          // 2. إدراج عنصر الفيديو
          const info = element;
          const videoEl = createVideoElement();
          row.appendChild(videoEl);

          // استخدام IntersectionObserver لتحميل بيانات الفيديو عند الاقتراب من الشاشة
          const observer = new IntersectionObserver(async (entries, obs) => {
              for (const entry of entries) {
                  if (entry.isIntersecting) {
                      await upgradeVideoElement(videoEl, info); 
                      obs.unobserve(entry.target);
                  }
              }
          }, { rootMargin: "200px" });
          observer.observe(videoEl);
      }
  });


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
    // الآن نحفظ الكائن كاملاً وليس فقط videoId
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
  window.open(url, '_blank'); 
}

window.handleVideoClick = handleVideoClick;

// يتم تشغيل الدالة مباشرة
loadVideos();
