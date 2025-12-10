'use client';

import { Button } from '@repo/ui';
import Link from 'next/link';
import { 
  Heart, 
  Target, 
  Eye, 
  Award, 
  Users, 
  ShoppingBag, 
  TrendingUp,
  Calendar,
  Shield,
  Leaf,
  Sparkles,
  CheckCircle2,
  Star,
  MapPin,
  Phone,
  Mail,
  Facebook,
  Instagram,
  Twitter
} from 'lucide-react';

export default function AboutPage() {
  // Statistics data
  const stats = [
    { icon: Users, value: '50,000+', label: 'Khách hàng hài lòng' },
    { icon: ShoppingBag, value: '10,000+', label: 'Sản phẩm chất lượng' },
    { icon: Calendar, value: '5+', label: 'Năm kinh nghiệm' },
    { icon: Award, value: '100+', label: 'Giải thưởng uy tín' },
  ];

  // Core values
  const values = [
    {
      icon: Heart,
      title: 'Đam mê thời trang',
      description: 'Chúng tôi yêu thời trang và mong muốn mang đến những sản phẩm chất lượng nhất cho khách hàng.',
      color: 'text-red-500',
      bgColor: 'bg-red-50',
    },
    {
      icon: Target,
      title: 'Chất lượng hàng đầu',
      description: 'Cam kết sản phẩm chính hãng, chất lượng cao với giá cả hợp lý nhất thị trường.',
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Shield,
      title: 'Uy tín & Tin cậy',
      description: 'Xây dựng niềm tin qua nhiều năm với dịch vụ khách hàng chuyên nghiệp và minh bạch.',
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      icon: Leaf,
      title: 'Bền vững',
      description: 'Cam kết với môi trường, sử dụng vật liệu thân thiện và quy trình sản xuất bền vững.',
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50',
    },
  ];

  // Team members
  const teamMembers = [
    {
      name: 'Nguyễn Văn A',
      position: 'CEO & Founder',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
      description: '15 năm kinh nghiệm trong ngành thời trang',
    },
    {
      name: 'Trần Thị B',
      position: 'Creative Director',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
      description: 'Chuyên gia thiết kế với nhiều giải thưởng quốc tế',
    },
    {
      name: 'Gờ Pê Tê',
      position: 'Head of Operations',
      image: 'https://th.bing.com/th/id/OIP.3W2anxiIji0mzDNoHB4wdQHaEK?w=276&h=180&c=7&r=0&o=7&dpr=1.3&pid=1.7&rm=3',
      description: 'Quản lý vận hành với hơn 10 năm kinh nghiệm',
    },
    {
      name: 'Phạm Thị D',
      position: 'Customer Success Manager',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
      description: 'Chăm sóc khách hàng chuyên nghiệp và tận tâm',
    },
  ];

  // Timeline/Milestones
  const milestones = [
    {
      year: '2019',
      title: 'Thành lập',
      description: 'Ra đời với sứ mệnh mang thời trang chất lượng đến mọi người',
    },
    {
      year: '2020',
      title: 'Mở rộng online',
      description: 'Xây dựng nền tảng thương mại điện tử và phục vụ 10,000 khách hàng',
    },
    {
      year: '2021',
      title: 'Nhận giải thưởng',
      description: 'Đạt giải "E-commerce xuất sắc nhất năm" do Hiệp hội Thương mại Điện tử trao tặng',
    },
    {
      year: '2022',
      title: 'Chuỗi cửa hàng',
      description: 'Mở rộng với 5 cửa hàng vật lý tại các thành phố lớn',
    },
    {
      year: '2023',
      title: 'Quốc tế hóa',
      description: 'Bắt đầu giao hàng quốc tế và hợp tác với các thương hiệu nổi tiếng',
    },
    {
      year: '2024',
      title: 'Tương lai',
      description: 'Tiếp tục phát triển và đổi mới với công nghệ AI và trải nghiệm số',
    },
  ];

  // Certifications & Partners
  const certifications = [
    {
      name: 'ISO 9001:2015',
      description: 'Chứng nhận quản lý chất lượng',
      icon: Award,
    },
    {
      name: 'Chứng nhận ECO',
      description: 'Sản phẩm thân thiện môi trường',
      icon: Leaf,
    },
    {
      name: 'Trusted Shop',
      description: 'Cửa hàng đáng tin cậy',
      icon: Shield,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent py-20 md:py-32">
        <div className="absolute inset-0 bg-dots-gradient opacity-40 pointer-events-none"></div>
        <div className="container-custom relative">
          <div className="max-w-3xl mx-auto text-center animate-fade-in-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              <span>Về chúng tôi</span>
            </div>
            <h1 className="mb-6 text-4xl font-bold md:text-5xl lg:text-6xl">
              Câu chuyện của <span className="gradient-text">Fashion E-commerce</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              Chúng tôi là thương hiệu thời trang hàng đầu, cam kết mang đến những sản phẩm chất lượng cao 
              và trải nghiệm mua sắm tuyệt vời nhất cho khách hàng.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/products">
                <Button size="lg" className="hover-lift">
                  Khám phá sản phẩm
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="hover-lift">
                  Liên hệ với chúng tôi
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="container-custom py-16 md:py-24">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="card group p-8 text-center hover-lift animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                <stat.icon className="h-8 w-8" />
              </div>
              <div className="mb-2 text-3xl font-bold md:text-4xl gradient-text">
                {stat.value}
              </div>
              <p className="text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Story Section */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-waves-peach opacity-30 pointer-events-none"></div>
        <div className="container-custom relative">
          <div className="grid gap-12 md:grid-cols-2 items-center">
            <div className="animate-fade-in-up">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <Heart className="h-4 w-4" />
                <span>Câu chuyện của chúng tôi</span>
              </div>
              <h2 className="mb-6 text-3xl font-bold md:text-4xl lg:text-5xl">
                Hành trình <span className="gradient-text">5 năm</span> phát triển
              </h2>
              <div className="space-y-4 text-muted-foreground text-lg">
                <p>
                  Fashion E-commerce được thành lập vào năm 2019 với tầm nhìn trở thành điểm đến hàng đầu 
                  cho những người yêu thời trang tại Việt Nam. Chúng tôi bắt đầu từ một cửa hàng nhỏ với 
                  niềm đam mê mang đến những bộ trang phục đẹp và chất lượng.
                </p>
                <p>
                  Qua nhiều năm phát triển, chúng tôi đã mở rộng cả về quy mô lẫn danh mục sản phẩm, 
                  từ quần áo, giày dép đến phụ kiện thời trang. Mỗi sản phẩm của chúng tôi đều được 
                  chọn lọc kỹ lưỡng để đảm bảo chất lượng và phong cách phù hợp với xu hướng hiện đại.
                </p>
                <p>
                  Ngày nay, chúng tôi tự hào phục vụ hàng chục nghìn khách hàng trên toàn quốc và 
                  tiếp tục phát triển với cam kết không ngừng cải thiện chất lượng dịch vụ.
                </p>
              </div>
            </div>
            <div className="relative animate-fade-in">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80"
                  alt="Our story"
                  className="w-full h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              </div>
              <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary/20 rounded-full blur-3xl"></div>
              <div className="absolute -top-6 -right-6 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="container-custom py-16 md:py-24">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="card p-8 md:p-12 hover-lift animate-fade-in">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <Target className="h-8 w-8" />
            </div>
            <h3 className="mb-4 text-2xl font-bold md:text-3xl">Sứ mệnh</h3>
            <p className="text-muted-foreground text-lg">
              Mang đến những sản phẩm thời trang chất lượng cao với giá cả hợp lý, giúp mọi người 
              có thể thể hiện phong cách cá nhân và tự tin trong cuộc sống hàng ngày. Chúng tôi cam kết 
              cung cấp dịch vụ khách hàng xuất sắc và trải nghiệm mua sắm tuyệt vời nhất.
            </p>
          </div>
          <div className="card p-8 md:p-12 hover-lift animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <Eye className="h-8 w-8" />
            </div>
            <h3 className="mb-4 text-2xl font-bold md:text-3xl">Tầm nhìn</h3>
            <p className="text-muted-foreground text-lg">
              Trở thành thương hiệu thời trang số 1 tại Việt Nam và mở rộng ra thị trường quốc tế. 
              Chúng tôi hướng tới việc xây dựng một cộng đồng những người yêu thời trang, nơi mọi người 
              có thể khám phá và thể hiện cá tính riêng của mình qua phong cách thời trang.
            </p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-diagonal-sky opacity-20 pointer-events-none"></div>
        <div className="container-custom relative">
          <div className="mb-12 text-center animate-fade-in-up">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Star className="h-4 w-4" />
              <span>Giá trị cốt lõi</span>
            </div>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl lg:text-5xl">
              Điều tạo nên <span className="gradient-text">chúng tôi</span>
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground text-lg">
              Những giá trị này định hướng mọi hành động và quyết định của chúng tôi
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {values.map((value, index) => (
              <div
                key={index}
                className={`card p-8 hover-lift text-center animate-fade-in ${value.bgColor}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-white ${value.color} transition-transform duration-300 hover:scale-110`}>
                  <value.icon className="h-8 w-8" />
                </div>
                <h3 className="mb-3 text-xl font-semibold">{value.title}</h3>
                <p className="text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline/Milestones */}
      <section className="container-custom py-16 md:py-24">
        <div className="mb-12 text-center animate-fade-in-up">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <Calendar className="h-4 w-4" />
            <span>Hành trình phát triển</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl lg:text-5xl">
            Cột mốc <span className="gradient-text">quan trọng</span>
          </h2>
        </div>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-1/2 hidden h-full w-1 -translate-x-1/2 bg-gradient-to-b from-primary/20 via-primary/40 to-primary/20 md:block"></div>
          
          <div className="space-y-12">
            {milestones.map((milestone, index) => (
              <div
                key={index}
                className={`relative flex flex-col md:flex-row items-center gap-8 animate-fade-in`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Content */}
                <div className={`w-full md:w-5/12 ${index % 2 === 0 ? 'md:text-right md:mr-auto' : 'md:text-left md:ml-auto'}`}>
                  <div className="card p-6 hover-lift">
                    <div className="mb-2 text-sm font-semibold text-primary">{milestone.year}</div>
                    <h3 className="mb-2 text-xl font-bold">{milestone.title}</h3>
                    <p className="text-muted-foreground">{milestone.description}</p>
                  </div>
                </div>

                {/* Timeline dot */}
                <div className="absolute left-1/2 hidden h-6 w-6 -translate-x-1/2 rounded-full border-4 border-white bg-primary shadow-lg md:block"></div>

                {/* Year badge - visible on mobile */}
                <div className="md:hidden">
                  <div className="rounded-full bg-primary px-4 py-2 text-sm font-bold text-white">
                    {milestone.year}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-dots-rose opacity-20 pointer-events-none"></div>
        <div className="container-custom relative">
          <div className="mb-12 text-center animate-fade-in-up">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Users className="h-4 w-4" />
              <span>Đội ngũ của chúng tôi</span>
            </div>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl lg:text-5xl">
              Gặp gỡ <span className="gradient-text">đội ngũ</span>
            </h2>
            <p className="mx-auto max-w-2xl text-muted-foreground text-lg">
              Những người tạo nên sự thành công của Fashion E-commerce
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="card group overflow-hidden p-0 hover-lift animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="h-64 w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                </div>
                <div className="p-6">
                  <h3 className="mb-1 text-xl font-bold">{member.name}</h3>
                  <p className="mb-2 text-sm font-medium text-primary">{member.position}</p>
                  <p className="text-sm text-muted-foreground">{member.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Commitments */}
      <section className="container-custom py-16 md:py-24">
        <div className="mb-12 text-center animate-fade-in-up">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <CheckCircle2 className="h-4 w-4" />
            <span>Cam kết của chúng tôi</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl lg:text-5xl">
            Những điều chúng tôi <span className="gradient-text">cam kết</span>
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            { title: 'Chất lượng sản phẩm', desc: '100% sản phẩm chính hãng, chất lượng cao' },
            { title: 'Dịch vụ khách hàng', desc: 'Hỗ trợ 24/7, giải đáp mọi thắc mắc' },
            { title: 'Giao hàng nhanh chóng', desc: 'Giao hàng trong 24h tại các thành phố lớn' },
            { title: 'Giá cả hợp lý', desc: 'Giá tốt nhất thị trường với nhiều chương trình khuyến mãi' },
            { title: 'Đổi trả miễn phí', desc: 'Đổi trả trong 30 ngày nếu không hài lòng' },
            { title: 'Bảo mật thông tin', desc: 'Bảo vệ thông tin khách hàng tuyệt đối' },
          ].map((commitment, index) => (
            <div
              key={index}
              className="card p-6 hover-lift animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="mb-3 flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-semibold">{commitment.title}</h3>
              </div>
              <p className="text-muted-foreground">{commitment.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Certifications & Partners */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-cross-elegant opacity-30 pointer-events-none"></div>
        <div className="container-custom relative">
          <div className="mb-12 text-center animate-fade-in-up">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <Award className="h-4 w-4" />
              <span>Chứng nhận & Đối tác</span>
            </div>
            <h2 className="mb-4 text-3xl font-bold md:text-4xl lg:text-5xl">
              Chứng nhận <span className="gradient-text">uy tín</span>
            </h2>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {certifications.map((cert, index) => (
              <div
                key={index}
                className="card p-8 text-center hover-lift animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <cert.icon className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-xl font-bold">{cert.name}</h3>
                <p className="text-muted-foreground">{cert.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container-custom py-16 md:py-24">
        <div className="card relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-12 text-center">
          <div className="absolute inset-0 bg-dots-gradient opacity-30 pointer-events-none"></div>
          <div className="relative">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Sẵn sàng khám phá <span className="gradient-text">bộ sưu tập</span> của chúng tôi?
            </h2>
            <p className="mb-8 mx-auto max-w-2xl text-muted-foreground text-lg">
              Hãy để chúng tôi giúp bạn tìm được phong cách hoàn hảo cho bản thân
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/products">
                <Button size="lg" className="hover-lift">
                  Mua sắm ngay
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="hover-lift">
                  Liên hệ chúng tôi
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

