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
    const script = document.createElement('script');
    script.setAttribute('type', 'application/ld+json');
    
    const descriptionForSchema = item.description || item.title;
    
    const schema = {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        "name": item.title,
        "description": descriptionForSchema, 
        "uploadDate": item.uploadDate || new Date().toISOString().split('T')[0],
        "thumbnailUrl": item.thumbUrl || `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`,
        "contentUrl": `https://www.youtube.com/watch?v=${item.videoId}`,
        "embedUrl": `https://www.youtube.com/embed/${item.videoId}`,
        "publisher": {
            "@type": "Organization",
            "name": "LevelUp",
            "logo": {
                "@type": "ImageObject",
                // 🚨 يجب تحديث هذا الرابط ليطابق مسار شعار موقعك الفعلي
                "url": "https://www.yourdomain.com/levelup_logo.png" 
            }
        }
    };
    script.textContent = JSON.stringify(schema, null, 2);
    document.head.appendChild(script);
}

/** يعرض تفاصيل الفيديو داخل الـ HTML */
function renderVideoDetails(item) {
    const container = document.getElementById('video-content');
    container.innerHTML = ''; 

    // 1. تحديث بيانات SEO في الـ head
    document.getElementById('page-title').textContent = item.title + ' | LevelUp';
    document.querySelector('meta[name="description"]').setAttribute('content', item.description || `شاهد وتعلّم مع فيديو ${item.title} ضمن قسم ${item.section} في LevelUp.`);
    injectSchemaMarkup(item); 

    // 2. مشغل الفيديو
    const playerDiv = document.createElement('div');
    playerDiv.className = 'video-player';
    // التأكد من أن المشغل يعمل بشكل صحيح
    playerDiv.innerHTML = `<iframe src="https://www.youtube.com/embed/${item.videoId}" title="${item.title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    container.appendChild(playerDiv);

    // 3. العنوان الرئيسي H1
    const h1 = document.createElement('h1');
    h1.textContent = item.title;
    h1.className = 'video-details';
    container.appendChild(h1);

    // 4. معلومات القناة
    const channelInfo = document.createElement('div');
    channelInfo.className = 'channel-info';
    channelInfo.innerHTML = `
        <img src="${item.channelThumb}" alt="صورة قناة ${item.channelTitle}">
        <span>${item.channelTitle}</span>
    `;
    container.appendChild(channelInfo);
    
    // 5. الوصف والتفسير المطوّل لـ SEO
    const h2Description = document.createElement('h2');
    h2Description.textContent = 'ملخص وتحليل الفيديو';
    container.appendChild(h2Description);
    
    const pDescription = document.createElement('p');
    pDescription.innerHTML = item.longDescription || item.description || 'لا يوجد وصف مطوّل لهذا الفيديو.'; 
    container.appendChild(pDescription);

    // 6. الملحقات (Attachments)
    if (item.attachments && Array.isArray(item.attachments) && item.attachments.length > 0) {
        const h3Attachments = document.createElement('h3');
        h3Attachments.textContent = 'ملحقات وموارد إضافية';
        container.appendChild(h3Attachments);

        const ulAttachments = document.createElement('div');
        ulAttachments.className = 'attachments-list';
        item.attachments.forEach(att => {
            const link = document.createElement('a');
            link.href = att.url;
            link.textContent = att.name;
            link.target = '_blank';
            ulAttachments.appendChild(link);
        });
        container.appendChild(ulAttachments);
    }
}


// ====================================
// 3. دالة جلب البيانات والتحكم الرئيسية
// ====================================

function loadVideoPage() {
    // 1. استخراج معرف الفيديو
    const urlParams = new URLSearchParams(window.location.search);
    const videoId = urlParams.get('id');

    if (!videoId || videoId === 'loading') { // إضافة فحص لقيمة التحميل المؤقتة
        // يمكننا ترك رسالة التحميل المؤقتة أو عرض خطأ لطيف
        document.getElementById('video-content').innerHTML = `<h1 style="text-align: center; color: #444;">جارٍ تحميل المحتوى أو لم يتم تحديد الفيديو.</h1>`;
        return;
    }
    
    // 2. البحث عن الفيديو باستخدام videoId
    const videosRef = ref(db, 'videos');
    // 🚨 ملاحظة مهمة: هذا الاستعلام يتطلب فهرسة (Indexing) لـ "videoId" في قواعد Firebase.
    // يرجى إضافة ".indexOn": "videoId" في قواعد قاعدة البيانات في لوحة تحكم Firebase.
    const videoQuery = query(videosRef, orderByChild('videoId'), equalTo(videoId));
    
    get(videoQuery).then((snapshot) => {
        if (snapshot.exists()) {
            const videoData = Object.values(snapshot.val())[0]; 
            // التحقق من وجود البيانات الأساسية قبل العرض
            if (videoData && videoData.title && videoData.videoId) {
                renderVideoDetails(videoData);
            } else {
                document.getElementById('video-content').innerHTML = `<h1 style="text-align: center; color: #444;">تم العثور على البيانات ولكنها غير كاملة.</h1>`;
            }
        } else {
            document.getElementById('video-content').innerHTML = `<h1 style="text-align: center; color: #444;">عذراً، لم يتم العثور على الفيديو بالمعرّف: ${videoId}</h1>`;
        }
    }).catch((error) => {
        console.error("خطأ في جلب بيانات الفيديو (تحقق من فهرسة Firebase):", error);
        // 🚨 عرض رسالة واضحة للمساعدة في تصحيح الأخطاء
        document.getElementById('video-content').innerHTML = `<h1 style="text-align: center; color: red;">حدث خطأ في جلب البيانات. الرجاء التحقق من فهارس Firebase ("videoId").</h1>`;
    });
}

// بدء تحميل الصفحة عند الانتهاء
document.addEventListener('DOMContentLoaded', loadVideoPage);
