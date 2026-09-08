const API_BASE = 'http://localhost:8000/api';

async function runTests() {
  console.log('=============== بدء الفحص والتأكد الفعلي (E2E Verification) ===============\n');

  // Test 1: Admin Login
  console.log('--- [اختبار 1] تسجيل دخول مدير النظام (admin@laqahi.com) ---');
  let adminToken = null;
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email: 'admin@laqahi.com', password: 'Admin@1234', role: 'admin' })
    });
    const status = res.status;
    const json = await res.json();
    console.log(`HTTP Status: ${status}`);
    console.log('استجابة السيرفر:', JSON.stringify(json, null, 2));

    if (res.ok && json.data?.token) {
      adminToken = json.data.token;
      console.log('✅ تم تسجيل دخول المدير بنجاح واستلام التوكن دور:', json.data.role);
    } else {
      console.error('❌ فشل تسجيل دخول المدير!');
    }
  } catch (err) {
    console.error('❌ خطأ في الاتصال بالمدير:', err.message);
  }

  console.log('\n------------------------------------------------------------\n');

  // Ensure a doctor account exists via Admin API if not present
  let doctorEmail = 'dr.laith@laqahi.com';
  let doctorPassword = 'Doctor@123';
  if (adminToken) {
    console.log('--- [إعداد] التأكد من وجود حساب طبيب في الباك إند عبر مدير النظام ---');
    try {
      const resCenter = await fetch(`${API_BASE}/admin/centers`, {
        headers: { 'Authorization': `Bearer ${adminToken}`, 'Accept': 'application/json' }
      });
      const centersJson = await resCenter.json();
      let centerId = centersJson.data?.[0]?.id;

      if (!centerId) {
        // Create center first if empty
        const cRes = await fetch(`${API_BASE}/admin/centers`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ name: 'مركز النور الصحي التجريبي', address: 'دمشق - المزة', phone: '0112223334' })
        });
        const cJson = await cRes.json();
        centerId = cJson.data?.id;
        console.log('تم إنشاء مركز صحي جديد بالتسلسل ID:', centerId);
      }

      // Create Doctor
      const docRes = await fetch(`${API_BASE}/admin/doctors`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          name: 'د. ليث حسان',
          email: doctorEmail,
          password: doctorPassword,
          national_id: '11112222333',
          center_id: centerId,
          specialization: 'أطفال',
          is_active: true
        })
      });
      const docJson = await docRes.json();
      console.log('نتيجة إنشاء/التأكد من الطبيب:', docJson.message || docJson);
    } catch (e) {
      console.log('ملاحظة أثناء إعداد حساب الطبيب:', e.message);
    }
  }

  console.log('\n------------------------------------------------------------\n');

  // Test 2: Doctor Login
  console.log('--- [اختبار 2] تسجيل دخول الطبيب (dr.laith@laqahi.com) ---');
  let doctorToken = null;
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email: doctorEmail, password: doctorPassword, role: 'doctor' })
    });
    const status = res.status;
    const json = await res.json();
    console.log(`HTTP Status: ${status}`);
    console.log('استجابة السيرفر:', JSON.stringify(json, null, 2));

    if (res.ok && json.data?.token) {
      doctorToken = json.data.token;
      console.log('✅ تم تسجيل دخول الطبيب بنجاح واستلام التوكن دور:', json.data.role);
    } else {
      console.error('❌ فشل تسجيل دخول الطبيب!');
    }
  } catch (err) {
    console.error('❌ خطأ في الاتصال بالطبيب:', err.message);
  }

  console.log('\n------------------------------------------------------------\n');

  // Test 3: Create Guardian -> Get parent_id -> Create Child flow
  console.log('--- [اختبار 3] التدفق الكامل: إنشاء حساب ولي أمر من قبل الطبيب ثم إضافة طفل ---');
  if (doctorToken) {
    try {
      const parentNatId = String(Math.floor(10000000000 + Math.random() * 90000000000));
      const parentEmail = `parent_${Date.now()}@example.com`;

      console.log(`1. استدعاء POST /api/doctor/parents لإنشاء ولي أمر برقم وطني: ${parentNatId}`);
      const parentRes = await fetch(`${API_BASE}/doctor/parents`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${doctorToken}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          name: 'أحمد محمود',
          email: parentEmail,
          password: 'Parent123Password',
          national_id: parentNatId,
          phone: '0911223344',
          mother_name: 'فاطمة',
          father_name: 'محمود'
        })
      });
      const parentStatus = parentRes.status;
      const parentJson = await parentRes.json();
      console.log(`HTTP Status (Parent Creation): ${parentStatus}`);
      console.log('استجابة إنشاء ولي الأمر:', JSON.stringify(parentJson, null, 2));

      const parentId = parentJson.data?.parent?.id || parentJson.data?.id;
      console.log('📍 الناتج parent_id المستخرج:', parentId);

      if (parentId) {
        console.log(`\n2. استدعاء POST /api/doctor/children باستخدام parent_id = ${parentId}`);
        const childRes = await fetch(`${API_BASE}/doctor/children`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${doctorToken}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            name: 'سامي أحمد',
            birth_date: '2024-05-15',
            gender: 'male',
            parent_id: parentId
          })
        });
        const childStatus = childRes.status;
        const childJson = await childRes.json();
        console.log(`HTTP Status (Child Creation): ${childStatus}`);
        console.log('استجابة إضافة الطفل مع اللقاحات التلقائية:', JSON.stringify(childJson, null, 2));

        const childId = childJson.data?.child?.id || childJson.data?.id;
        if (childRes.ok && childId) {
          console.log(`✅ نجحت عملية إضافة الطفل وتوليد المواعيد واللقاحات بنجاح! ID = ${childId}, عدد اللقاحات التلقائية المكتوبة: ${childJson.data?.appointments_count}`);
        } else {
          console.error('❌ فشلت إضافة الطفل مع parent_id!');
        }
      } else {
        console.error('❌ لم يتم استخراج parent_id بنجاح!');
      }
    } catch (err) {
      console.error('❌ خطأ في تدفق إنشاء ولي الأمر والطفل:', err.message);
    }
  }

  console.log('\n------------------------------------------------------------\n');

  // Test 4: Route protection (Parent token accessing Admin endpoint)
  console.log('--- [اختبار 4] حماية المسارات (محاولة ولي أمر فتح مسارات المدير) ---');
  try {
    // 1. Register or login a parent to get parent token
    const parentNatId = String(Math.floor(10000000000 + Math.random() * 90000000000));
    const parentEmail = `parent_user_${Date.now()}@example.com`;
    const regRes = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        name: 'ولي أمر تجريبي',
        email: parentEmail,
        password: 'Parent123Password',
        password_confirmation: 'Parent123Password',
        national_id: parentNatId,
        phone: '0988776655'
      })
    });
    const regJson = await regRes.json();
    const parentToken = regJson.data?.token;

    console.log('تم التسجيل كولي أمر واستلام التوكن دور:', regJson.data?.role);

    if (parentToken) {
      console.log('2. إرسال طلب من ولي الأمر لمسار حاص بمدير النظام GET /api/admin/centers...');
      const adminEndpointRes = await fetch(`${API_BASE}/admin/centers`, {
        headers: { 'Authorization': `Bearer ${parentToken}`, 'Accept': 'application/json' }
      });
      const adminStatus = adminEndpointRes.status;
      const adminJson = await adminEndpointRes.json();
      console.log(`HTTP Status: ${adminStatus}`);
      console.log('استجابة الباك إند لولي الأمر عند دخول مسار المدير:', JSON.stringify(adminJson, null, 2));

      if (adminStatus === 403 || adminStatus === 401) {
        console.log(`✅ حماية الباك إند تعمل بنجاح: تم رفض وصول ولي الأمر بتأمين Sanctum! (HTTP Status: ${adminStatus})`);
      } else {
        console.error('⚠️ تحذير: الباك إند لم يمنع الوصول!');
      }
    }
  } catch (err) {
    console.error('❌ خطأ في اختبار حماية المسارات:', err.message);
  }

  console.log('\n============================================================\n');
}

runTests();
