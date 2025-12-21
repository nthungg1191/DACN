'use client';

import { useState } from 'react';
import { Button } from '@repo/ui';
import { Textarea } from '@repo/ui';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import Link from 'next/link';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Facebook,
  Instagram,
  Twitter,
  Headphones,
  HelpCircle,
  ShoppingBag,
} from 'lucide-react';
import { FOOTER_LINKS } from '@/lib/constants';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || 'Đã xảy ra lỗi khi gửi tin nhắn. Vui lòng thử lại sau.');
        return;
      }

      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
    } catch (err) {
      setError('Đã xảy ra lỗi khi gửi tin nhắn. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  // Contact information
  const contactInfo = [
    {
      icon: MapPin,
      title: 'Địa chỉ',
      details: ['120 Yên Lãng', 'Đống Đa, Hà Nội', 'Việt Nam'],
      color: 'text-red-500',
      bgColor: 'bg-red-50',
    },
    {
      icon: Phone,
      title: 'Điện thoại',
      details: ['Hotline: 1900 1234', 'Tel: (028) 1234 5678', 'Mobile: 0909 123 456'],
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      icon: Mail,
      title: 'Email',
      details: ['info@fashion-ecommerce.vn', 'support@fashion-ecommerce.vn', 'sales@fashion-ecommerce.vn'],
      color: 'text-green-500',
      bgColor: 'bg-green-50',
    },
    {
      icon: Clock,
      title: 'Giờ làm việc',
      details: ['Thứ 2 - Thứ 6: 8:00 - 18:00', 'Thứ 7 - Chủ nhật: 9:00 - 17:00', 'Hỗ trợ 24/7 qua email'],
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
    },
  ];

  // Quick help topics
  const helpTopics = [
    {
      icon: ShoppingBag,
      title: 'Câu hỏi về đơn hàng',
      description: 'Theo dõi đơn hàng, đổi trả, hoàn tiền',
      link: '/orders',
    },
    {
      icon: HelpCircle,
      title: 'Câu hỏi thường gặp',
      description: 'Tìm câu trả lời nhanh cho các vấn đề phổ biến',
      link: '/faq',
    },
    {
      icon: Headphones,
      title: 'Hỗ trợ kỹ thuật',
      description: 'Giúp đỡ về website, tài khoản, thanh toán',
      link: '#support',
    },
    {
      icon: MessageSquare,
      title: 'Phản hồi & Góp ý',
      description: 'Chia sẻ ý kiến để chúng tôi cải thiện dịch vụ',
      link: '#feedback',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent py-20 md:py-32">
        <div className="container-custom relative">
          <div className="max-w-3xl mx-auto text-center animate-fade-in-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
              <MessageSquare className="h-4 w-4" />
              <span>Liên hệ với chúng tôi</span>
            </div>
            <h1 className="mb-6 text-4xl font-bold md:text-5xl lg:text-6xl">
              Chúng tôi sẵn sàng hỗ trợ bạn
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              Có câu hỏi hoặc cần hỗ trợ? Hãy liên hệ với chúng tôi. Đội ngũ của chúng tôi luôn sẵn sàng 
              giúp đỡ bạn 24/7.
            </p>
          </div>
        </div>
      </section>

      {/* Quick Help Topics */}
      <section className="container-custom py-12 md:py-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {helpTopics.map((topic, index) => (
            <Link
              key={index}
              href={topic.link}
              className="card group p-6 hover-lift animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                <topic.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{topic.title}</h3>
              <p className="text-sm text-muted-foreground">{topic.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Main Content: Form + Contact Info */}
      <section className="container-custom py-16 md:py-24">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Contact Form */}
          <div className="animate-fade-in-up">
            <div className="mb-6">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">Gửi tin nhắn cho chúng tôi</h2>
              <p className="text-muted-foreground">
                Điền form bên dưới và chúng tôi sẽ phản hồi trong vòng 24 giờ.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Success Message */}
              {success && (
                <div className="rounded-lg bg-green-50 border border-green-200 p-4 animate-fade-in-down">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm font-medium">
                      Cảm ơn bạn! Tin nhắn của bạn đã được gửi thành công. Chúng tôi sẽ phản hồi sớm nhất có thể.
                    </p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4 animate-fade-in-down">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                </div>
              )}

              {/* Name Field */}
              <div>
                <Label htmlFor="name">
                  Họ và tên <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="Nguyễn Văn A"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                  className="mt-2"
                />
              </div>

              {/* Email & Phone Row */}
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="example@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={loading}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">
                    Số điện thoại <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    placeholder="0909 123 456"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={loading}
                    className="mt-2"
                  />
                </div>
              </div>

              {/* Subject Field */}
              <div>
                <Label htmlFor="subject">
                  Chủ đề <span className="text-red-500">*</span>
                </Label>
                <select
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  disabled={loading}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 mt-2"
                >
                  <option value="">Chọn chủ đề</option>
                  <option value="general">Câu hỏi chung</option>
                  <option value="order">Câu hỏi về đơn hàng</option>
                  <option value="product">Câu hỏi về sản phẩm</option>
                  <option value="return">Đổi trả hàng</option>
                  <option value="payment">Thanh toán</option>
                  <option value="technical">Hỗ trợ kỹ thuật</option>
                  <option value="feedback">Phản hồi & Góp ý</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              {/* Message Field */}
              <div>
                <Label htmlFor="message">
                  Tin nhắn <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  placeholder="Nhập tin nhắn của bạn..."
                  value={formData.message}
                  onChange={handleChange}
                  disabled={loading}
                  className="mt-2"
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                disabled={loading}
                className="w-full hover-lift"
              >
                {loading ? (
                  <>
                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-5 w-5" />
                    Gửi tin nhắn
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div>
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">Thông tin liên hệ</h2>
              <p className="text-muted-foreground">
                Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn mọi lúc, mọi nơi.
              </p>
            </div>

            <div className="space-y-6">
              {contactInfo.map((info, index) => (
                <div
                  key={index}
                  className="card p-6 hover-lift animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full ${info.bgColor} ${info.color}`}>
                    <info.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 text-lg font-semibold">{info.title}</h3>
                  <ul className="space-y-1">
                    {info.details.map((detail, idx) => (
                      <li key={idx} className="text-muted-foreground">
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Social Media */}
            <div className="card p-6">
              <h3 className="mb-4 text-lg font-semibold">Theo dõi chúng tôi</h3>
              <div className="flex gap-4">
                {FOOTER_LINKS.social.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary transition-all duration-300 hover:bg-primary hover:text-white hover:scale-110"
                  >
                    {social.label === 'Facebook' && <Facebook className="h-5 w-5" />}
                    {social.label === 'Instagram' && <Instagram className="h-5 w-5" />}
                    {social.label === 'Twitter' && <Twitter className="h-5 w-5" />}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="container-custom pb-16 md:pb-24">
        <div className="mb-8 text-center animate-fade-in-up">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
            <MapPin className="h-4 w-4" />
            <span>Vị trí của chúng tôi</span>
          </div>
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Tìm đường đến cửa hàng
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Ghé thăm cửa hàng của chúng tôi tại trung tâm thành phố
          </p>
        </div>

        <div className="card overflow-hidden p-0 animate-fade-in">
          {/* Google Maps Embed */}
          <div className="relative h-[400px] md:h-[500px] w-full bg-gray-200">
            <iframe
              src="https://maps.google.com/maps?q=120+Yên+Lãng,+Đống+Đa,+Hà+Nội,+Việt+Nam&t=m&z=15&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0"
              title="Vị trí cửa hàng - 120 Yên Lãng, Đống Đa, Hà Nội"
            ></iframe>
          </div>
        </div>
      </section>

      {/* Additional Support Info */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-16 md:py-24 relative overflow-hidden">
        <div className="container-custom relative">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="card p-8 text-center hover-lift animate-fade-in">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Clock className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-xl font-bold">Phản hồi nhanh</h3>
              <p className="text-muted-foreground">
                Chúng tôi phản hồi tất cả các yêu cầu trong vòng 24 giờ
              </p>
            </div>

            <div className="card p-8 text-center hover-lift animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
                <Headphones className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-xl font-bold">Hỗ trợ 24/7</h3>
              <p className="text-muted-foreground">
                Đội ngũ hỗ trợ khách hàng luôn sẵn sàng giúp đỡ bạn
              </p>
            </div>

            <div className="card p-8 text-center hover-lift animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="mb-2 text-xl font-bold">Cam kết chất lượng</h3>
              <p className="text-muted-foreground">
                Dịch vụ khách hàng chuyên nghiệp và tận tâm
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

