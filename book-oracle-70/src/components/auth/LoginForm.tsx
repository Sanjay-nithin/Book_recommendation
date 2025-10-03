import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BookOpen, Eye, EyeOff, Loader2 } from 'lucide-react';
import { apiService } from '@/services/services.api';
import { useToast } from '@/hooks/use-toast';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [failedOnce, setFailedOnce] = useState(false);
  // Forgot password flow state
  const [showReset, setShowReset] = useState(false);
  const [resetStep, setResetStep] = useState<'email'|'otp'|'new'>('email');
  const [fpEmail, setFpEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpId, setOtpId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState('');
  
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await apiService.login({ email, password });
      if ('error' in res) {
        setError(res.error);
        setFailedOnce(true);
        return;
      }

      const { user } = res.data;
      toast({
        title: 'Welcome back!',
        description: `Hello ${user.first_name}, you're successfully logged in.`,
      });

      if (!user.favorite_genres?.length && !user.is_admin) {
        navigate('/preferences');
        return;
      }

      if (user.is_admin) navigate('/admin/dashboard');
      else navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-accent-soft/20 p-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-hero rounded-2xl mb-4 shadow-hero">
            <BookOpen className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">BookWise</h1>
          <p className="text-muted-foreground mt-2">Welcome back to your reading journey</p>
        </div>

        <Card className="shadow-book hover:shadow-book-hover transition-all duration-300">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="animate-fade-in">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="transition-all duration-300 focus:shadow-book"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pr-10 transition-all duration-300 focus:shadow-book"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

              {/* Forgot password entry point */}
              {failedOnce && !showReset && (
                <div className="mt-3 text-sm text-center">
                  <button
                    className="text-primary hover:underline"
                    onClick={() => {
                      setShowReset(true);
                      setResetStep('email');
                      setFpEmail(email);
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Forgot password inline flow */}
              {showReset && (
                <div className="mt-4 p-4 border rounded-md space-y-3">
                  {resetStep === 'email' && (
                    <>
                      <Label htmlFor="fp-email">Account email</Label>
                      <div className="flex gap-2">
                        <Input
                          id="fp-email"
                          type="email"
                          placeholder="your@email.com"
                          value={fpEmail}
                          onChange={(e) => setFpEmail(e.target.value)}
                        />
                        <Button
                          onClick={async () => {
                            if (!fpEmail) return;
                            const res = await apiService.forgotPassword(fpEmail);
                            if (res.ok) {
                              toast({ title: 'OTP sent', description: 'Check your email for the OTP.'});
                              setResetStep('otp');
                            } else {
                              toast({ title: 'Failed to send OTP', description: res.error || 'Try again later', variant: 'destructive'});
                            }
                          }}
                        >
                          Send OTP
                        </Button>
                      </div>
                    </>
                  )}

                  {resetStep === 'otp' && (
                    <>
                      <Label htmlFor="otp">Enter OTP</Label>
                      <div className="flex gap-2">
                        <Input
                          id="otp"
                          placeholder="6-digit code"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          inputMode="numeric"
                        />
                        <Button
                          onClick={async () => {
                            if (!fpEmail || !otp) return;
                            const res = await apiService.verifyOtp(fpEmail, otp);
                            if (res.ok && res.data?.otp_id) {
                              setOtpId(res.data.otp_id);
                              toast({ title: 'OTP verified' });
                              setResetStep('new');
                            } else {
                              toast({ title: 'Invalid OTP', description: res.error || 'Try again', variant: 'destructive'});
                            }
                          }}
                        >
                          Verify
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setShowReset(false);
                            setResetStep('email');
                            setOtp('');
                            setOtpId(null);
                            setNewPassword('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  )}

                  {resetStep === 'new' && (
                    <>
                      <Label htmlFor="new-pass">New password</Label>
                      <div className="flex gap-2">
                        <Input
                          id="new-pass"
                          type="password"
                          placeholder="Enter new password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <Button
                          onClick={async () => {
                            if (!fpEmail || !otpId || !newPassword) return;
                            const res = await apiService.resetPassword(fpEmail, otpId, newPassword);
                            if (res.ok) {
                              toast({ title: 'Password updated', description: 'Please sign in with your new password.'});
                              setShowReset(false);
                              setResetStep('email');
                              setOtp('');
                              setOtpId(null);
                              setNewPassword('');
                            } else {
                              toast({ title: 'Failed to update password', description: res.error || 'Try again', variant: 'destructive'});
                            }
                          }}
                        >
                          Update
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )}
              
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <Link 
                    to="/register" 
                    className="text-primary hover:text-primary-glow font-medium hover:underline transition-colors"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginForm;
