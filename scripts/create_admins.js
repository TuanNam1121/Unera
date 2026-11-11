const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function createAdmins() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/Unera';
  console.log(`Connecting to MongoDB at: ${uri}`);
  await mongoose.connect(uri);

  const defaultPassword = await bcrypt.hash('Admin@123456', 10);

  const adminAccounts = [
    {
      name: 'Ban Quản Trị Unera',
      email: 'admin@unera.edu.vn',
      password: defaultPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=UneraAdmin',
      updatedAt: new Date(),
    },
    {
      name: 'Nguyễn Hoàng Lan (Cố vấn & Học bổng)',
      email: 'admin.lan@unera.edu.vn',
      password: defaultPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LanNguyen',
      updatedAt: new Date(),
    },
    {
      name: 'Trần Đức Minh (Cơ hội & Doanh nghiệp)',
      email: 'admin.minh@unera.edu.vn',
      password: defaultPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MinhTran',
      updatedAt: new Date(),
    },
    {
      name: 'Phòng CT&CTHSSV ULIS',
      email: 'quantri@ulis.edu.vn',
      password: defaultPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=UlisAdmin',
      updatedAt: new Date(),
    },
  ];

  for (const acc of adminAccounts) {
    await mongoose.connection.collection('users').updateOne(
      { email: acc.email },
      {
        $set: acc,
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );
    console.log(`✓ Đã thiết lập tài khoản Admin: ${acc.email} (${acc.name})`);
  }

  // Nâng quyền tài khoản Google nếu có
  const googleUser = await mongoose.connection.collection('users').findOne({ email: 'emnam2k5@gmail.com' });
  if (googleUser) {
    await mongoose.connection.collection('users').updateOne(
      { email: 'emnam2k5@gmail.com' },
      { $set: { role: 'ADMIN', updatedAt: new Date() } }
    );
    console.log('✓ Đã nâng quyền tài khoản Google cá nhân emnam2k5@gmail.com thành: ADMIN');
  }

  const allAdmins = await mongoose.connection.collection('users').find({ role: 'ADMIN' }).toArray();
  console.log(`\n========================================`);
  console.log(`DANH SÁCH TÀI KHOẢN QUẢN TRỊ VIÊN (${allAdmins.length} tài khoản):`);
  console.log(`========================================`);
  allAdmins.forEach((a, i) => {
    console.log(`${i + 1}. Họ tên: ${a.name}`);
    console.log(`   Email: ${a.email}`);
    console.log(`   Vai trò: ${a.role} | Trạng thái: ${a.status}`);
    console.log(`   Mật khẩu: Admin@123456 (hoặc đăng nhập trực tiếp qua Google đối với tài khoản Gmail)\n`);
  });

  await mongoose.disconnect();
  console.log('Hoàn tất!');
}

createAdmins().catch((err) => {
  console.error('Lỗi khi tạo tài khoản admin:', err);
  process.exit(1);
});

