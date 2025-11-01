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
// 2. دوال بناء الواجهة والـ SEO
// ====================================

/** يضيف ترميز Schema.org/VideoObject الضروري لـ SEO */
function injectSchemaMarkup(item) {
    // 🚨 الإصلاح النهائي: التحقق من وجود جميع الحقول المطلوبة قبل الحقن
    if (!item || !item.title || !item.videoId || !item.description || item.description.trim() === '') {
        console.warn("لا يمكن حقن Schema Markup: بيانات الفيديو غير كاملة. يرجى ملء حقل الوصف (description).");
        return; 
    }
    
    const script = document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    
    const thumbnailUrl = `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`;
    const uploadDate = item.uploadDate || new Date().toISOString().split('T')[0];
    
    const schema = {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        "name": item.title,
        "description": item.description, // نضمن الآن وجود الوصف
        "thumbnailUrl": thumbnailUrl,
        "uploadDate": uploadDate,
        "duration": item.duration || "PT0M0S", 
        "contentUrl": `https://www.youtube.com/watch?v=${item.videoId}`,
        "embedUrl": `https://www.youtube.com/embed/${item.videoId}`,
        "publisher": {
            "@type": "Organization",
            "name": "LevelUp",
            "logo": {
                "@type": "ImageObject",
                "url": "https://www.Level2up.online/levelup_logo.png" 
            }
        },
        "creator": {
            "@type": "Person",
            "name": item.channelTitle || "غير محدد"
        }
    };
    
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
}

/** يعرض تفاصيل الفيديو والمشغل ويحدّث الـ SEO */
function renderVideoDetails(item) {
    const videoContent = document.getElementById('video-content');
    
    // 1. تحديث الـ SEO الأساسي
    document.getElementById('page-title').textContent = `${item.title} | LevelUp`;
    
    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) {
        descriptionMeta.setAttribute('content', item.description || `شاهد ${item.title} الآن على LevelUp.`);
    }

    // 2. حقن ترميز الفيديو (Video Schema)
    injectSchemaMarkup(item); 
    
    // 3. عرض المشغل والتفاصيل
    videoContent.innerHTML = `
        <div class="video-player">
            <iframe src="https://www.youtube.com/embed/${item.videoId}?autoplay=1"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen>
            </iframe>
        </div>
        
        <h1 class="video-title-main">${item.title}</h1>
        
        <div class="channel-info-bar">
            <a href="${item.channelUrl || '#'}" target="_blank">
                <img src="${item.channelThumb}" class="channel-thumb-large" alt="${item.channelTitle}">
            </a>
            <div class="channel-text">
                <div class="channel-title-main">${item.channelTitle}</div>
                <div class="video-description">${item.description || "لا يوجد وصف لهذا الفيديو."}</div>
            </div>
        </div>
    `;

    document.getElementById('related-videos-container').innerHTML = `<p style="color:#555; text-align: center;">لا يوجد حالياً نظام لإظهار الفيديوهات ذات الصلة.</p>`;
}


// ====================================
// 3. دالة بدء التشغيل
// ====================================

function loadVideoPage() {
    const params = new URLSearchParams(window.location.search);
    const videoId = params.get('id');

    const videoContent = document.getElementById('video-content');
    
    if (!videoId || videoId.trim() === '') {
        videoContent.innerHTML = `<h1 style="text-align: center; color: red;">عذراً، يجب تحديد معرّف فيديو (ID).</h1>`;
        return;
    }
    
    const videosRef = ref(db, 'videos');
    // الاستعلام يعتمد على فهرسة 'videoId'
    const videoQuery = query(videosRef, orderByChild('videoId'), equalTo(videoId));
    
    get(videoQuery).then((snapshot) => {
        if (snapshot.exists()) {
            const videoData = Object.values(snapshot.val())[0]; 
            
            if (videoData && videoData.title && videoData.videoId) {
                renderVideoDetails(videoData);
            } else {
                videoContent.innerHTML = `<h1 style="text-align: center; color: #444;">تم العثور على البيانات ولكنها غير كاملة.</h1>`;
            }
        } else {
            videoContent.innerHTML = `<h1 style="text-align: center; color: #444;">عذراً، لم يتم العثور على الفيديو بالمعرّف: ${videoId}</h1>`;
        }
    }).catch((error) => {
        console.error("خطأ في جلب بيانات الفيديو (تحقق من فهرسة Firebase):", error);
        videoContent.innerHTML = `<h1 style="text-align: center; color: red;">حدث خطأ في جلب البيانات. الرجاء التحقق من فهرسة Firebase وتأكد من أن المعرّف صحيح.</h1>`;
    });
}

loadVideoPage();
