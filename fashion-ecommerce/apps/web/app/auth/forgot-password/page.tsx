'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.error || 'Có lỗi xảy ra. Vui lòng thử lại sau.');
        return;
      }

      setSuccess(true);
      toast.success('Email đã được gửi!', {
        description: 'Vui lòng kiểm tra hộp thư của bạn để đặt lại mật khẩu.',
      });
    } catch (err) {
      console.error('Forgot password error:', err);
      toast.error('Có lỗi xảy ra. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>
      
      {/* Subtle floating shapes */}
      <div className="absolute top-20 left-10 w-40 h-40 bg-rose-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-40 right-10 w-40 h-40 bg-stone-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-1/2 w-40 h-40 bg-neutral-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 md:p-10 shadow-xl border border-gray-200/50 animate-fade-in-up">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-900 text-white shadow-lg">
              <Mail className="h-8 w-8" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Quên mật khẩu?
            </h2>
            <p className="text-gray-600">
              {success 
                ? 'Chúng tôi đã gửi link đặt lại mật khẩu đến email của bạn'
                : 'Nhập email của bạn và chúng tôi sẽ gửi link đặt lại mật khẩu'}
            </p>
          </div>

          {success ? (
            <div className="space-y-6">
              <div className="rounded-lg bg-green-50 border border-green-200 p-4 animate-fade-in-down">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800">
                      Email đã được gửi thành công!
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      Vui lòng kiểm tra hộp thư của bạn (bao gồm cả thư mục spam) và nhấp vào link đặt lại mật khẩu.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                <p className="text-sm text-blue-800">
                  <strong>Lưu ý:</strong> Link đặt lại mật khẩu sẽ hết hạn sau <strong>10 phút</strong>.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={() => {
                    setSuccess(false);
                    setEmail('');
                  }}
                  variant="outline"
                  size="lg"
                  className="w-full border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 font-semibold transition-all duration-300"
                >
                  Gửi lại email
                </Button>
                <Link href="/auth/signin">
                  <Button variant="ghost" size="lg" className="w-full">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Quay lại đăng nhập
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                  Email
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-gray-900 transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 border border-gray-300 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-all"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Đang gửi...
                  </>
                ) : (
                  <>
                    Gửi link đặt lại mật khẩu
                    <Mail className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>

              <div className="text-center">
                <Link 
                  href="/auth/signin"
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Quay lại đăng nhập
                </Link>
              </div>
            </form>
          )}

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Chưa có tài khoản?{' '}
              <Link 
                href="/auth/register" 
                className="font-semibold text-gray-900 hover:text-gray-700 transition-colors underline underline-offset-4"
              >
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <Link 
            href="/" 
            className="text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors inline-flex items-center gap-1"
          >
            ← Quay lại trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

