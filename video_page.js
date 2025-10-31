import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, query, orderByChild, equalTo, get } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ====================================
// 1. إعدادات Firebase
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

// ====================================
// 2. دوال مساعدة
// ====================================

/** تجلب معلومات الفيديو (العنوان والصورة) من YouTube Data API */
async function getYoutubeInfo(videoId){
  try{
    const API_KEY = "AIzaSyAeZ8GxeJ04NjKGFx7ABeq8khEkdAnvuVk";
    const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${API_KEY}`);
    const data = await response.json();
    const snippet = data?.items?.[0]?.snippet;
    
    if(!snippet) return null;

    return { 
      title: snippet.title, 
      // نستخدم صورة عالية الجودة
      thumb: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` 
    };
  }catch(e){ 
    console.error("فشل جلب بيانات يوتيوب:", e);
    return null; 
  }
}

/** تنظيف النص من علامات HTML */
function escapeHtml(s = "") {
    return s.replace(/[&<>"']/g, m => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[m]));
}

// ====================================
// 3. دوال بناء الواجهة
// ====================================

/** يقوم بعرض تفاصيل الفيديو في الواجهة (صورة و Tags) */
function renderVideoDetails(item) {
    // 1. جلب بيانات يوتيوب للعنوان والصورة
    const infoPromise = getYoutubeInfo(item.videoId);
    
    infoPromise.then(info => {
        const title = info?.title || item.name || "فيديو LevelUp";
        const thumb = info?.thumb || `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`;
        
        // 2. تحديث SEO والـ Title
        document.getElementById('page-title').textContent = title;
        // يمكن استخدام مكتبة SEO خارجية أو استخدام خاصية topic
        const description = item.topic ? `شاهد فيديو ${title}: ${item.topic}` : title;
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', description);
        }
        
        // 3. معالجة الوسوم (Tags)
        let tagsHtml = '';
        let topicTags = [];

        // إضافة القسم كـ Tag
        if (item.section) {
            topicTags.push(item.section);
        }
        
        // تقسيم حقل 'topic' إلى كلمات مفتاحية (وسوم)
        if (item.topic) {
             // تقسيم بناءً على الفواصل والشرطات (للسماح بالمرونة في الإدخال)
            const parts = item.topic.split(/[,،/|]/).map(t => t.trim()).filter(t => t.length > 0);
            topicTags = [...topicTags, ...parts];
        }
        
        // إزالة التكرارات
        const uniqueTags = [...new Set(topicTags)].slice(0, 8); // عرض 8 وسوم كحد أقصى

        uniqueTags.forEach(tag => {
            // يمكن ربط الوسم بصفحة بحث لاحقاً: href="search.html?q=${tag}"
            tagsHtml += `<a href="#" class="tag">${escapeHtml(tag)}</a>`; 
        });

        // 4. بناء محتوى الصفحة
        const videoContentDiv = document.getElementById('video-content');
        videoContentDiv.innerHTML = `
            <div class="content-card">
                
                <div class="thumbnail-container">
                    <img src="${thumb}" alt="${title}">
                </div>

                <div class="video-details">
                    <h1>${title}</h1>
                    <p>${escapeHtml(item.topic || 'لا يوجد وصف متاح لهذا الفيديو.')}</p>
                    
                    <a href="https://www.youtube.com/watch?v=${item.videoId}" target="_blank" class="watch-button">
                        شاهد الفيديو كاملاً على يوتيوب 
                    </a>

                    <div class="tags-container">
                        ${tagsHtml}
                    </div>
                </div>
            </div>
        `;

        // 5. تحميل الفيديوهات ذات الصلة (إذا كانت هذه الدالة موجودة)
        // loadRelatedVideos(item.section, item.key); 

    }).catch(error => {
        console.error("فشل في عرض تفاصيل الفيديو:", error);
        document.getElementById('video-content').innerHTML = `<h1 style="text-align: center; color: red;">حدث خطأ أثناء عرض التفاصيل.</h1>`;
    });
}

// ====================================
// 4. دالة التشغيل الرئيسية
// ====================================

/** تستخرج الـ videoId من الرابط وتبدأ عملية جلب البيانات */
function initVideoPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('id');

    if (!videoId) {
        document.getElementById('video-content').innerHTML = `<h1 style="text-align: center; color: #444;">لم يتم تحديد معرّف الفيديو (ID).</h1>`;
        return;
    }

    // جلب بيانات الفيديو باستخدام videoId
    const videosRef = ref(db, 'videos');
    // 🚨 تذكر: هذا الاستعلام يتطلب فهرسة لـ "videoId" في قواعد Firebase: ".indexOn": "videoId"
    const videoQuery = query(videosRef, orderByChild('videoId'), equalTo(videoId));
    
    get(videoQuery).then((snapshot) => {
        if (snapshot.exists()) {
            // بما أننا نبحث بـ equalTo، يجب أن نأخذ القيمة الأولى من النتائج
            const videoData = Object.values(snapshot.val())[0]; 
            
            if (videoData && videoData.videoId) {
                renderVideoDetails(videoData);
            } else {
                document.getElementById('video-content').innerHTML = `<h1 style="text-align: center; color: #444;">تم العثور على البيانات ولكنها غير كاملة.</h1>`;
            }
        } else {
            document.getElementById('video-content').innerHTML = `<h1 style="text-align: center; color: #444;">عذراً، لم يتم العثور على الفيديو بالمعرّف: ${videoId}</h1>`;
        }
    }).catch((error) => {
        console.error("خطأ في جلب بيانات الفيديو (تحقق من فهرسة Firebase):", error);
        document.getElementById('video-content').innerHTML = `<h1 style="text-align: center; color: red;">حدث خطأ في جلب البيانات. الرجاء التحقق من فهرسة Firebase.</h1>`;
    });
}

// تشغيل وظيفة التحميل عند بدء الصفحة
initVideoPage();
