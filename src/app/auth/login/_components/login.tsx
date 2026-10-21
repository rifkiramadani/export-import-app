"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INITIAL_LOGIN_FORM, INTIAL_STATE_LOGIN } from "@/constants/auth";
import { LoginForm, loginSchema } from "@/lib/validations/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useActionState, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { login } from "../../action";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import { Eye, EyeClosed } from "lucide-react";
import Link from "next/link";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "cn";

interface ILoginPage {
  title: string;
  description: string;
}

const Login = ({ title, description }: ILoginPage) => {
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const message = searchParams.get("message");

  useEffect(() => {
    if (message) {
      toast.success("Email Verification Needed", {
        description: message,
      });

      window.history.replaceState({}, "", window.location.pathname);
    }
  });

  const {
    register,
    handleSubmit,
    formState: { errors: formErrors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: INITIAL_LOGIN_FORM,
  });

  const [state, formAction, isPending] = useActionState(
    login,
    INTIAL_STATE_LOGIN,
  );

  const onSubmit = (data: LoginForm) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });
    startTransition(() => {
      formAction(formData);
    });
  };

  useEffect(() => {
    if (state?.status === "error" && state.errors?._form?.[0]) {
      toast.error("Login Failed", {
        description: state.errors._form[0],
      });
    }
  }, [state]);

  return (
    <Card className="bg-linear-to-br from-secondary to-primary text-white shadow-2xl shadow-secondary">
      <CardHeader className="space-x-4">
        <CardTitle className="text-3xl font-thin">{title}</CardTitle>
        <CardDescription className="text-white font-light">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="px-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="font-light">
              Email
            </Label>
            <Input
              {...register("email")}
              id="email"
              type="email"
              placeholder="Input Your Email"
              className={cn(
                "placeholder:text-gray-400 bg-gray-700",
                (formErrors.email || state.errors?.email?.[0]) &&
                  "ring-2 ring-red-500 focus-visible:ring-red-500",
              )}
            />
            {(formErrors.email?.message || state.errors?.email?.[0]) && (
              <span className="text-xs text-red-500">
                {formErrors.email?.message || state.errors?.email?.[0]}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2 mt-4 mb-3">
            <Label htmlFor="password" className="font-light">
              Password
            </Label>
            <div className="flex flex-row space-x-2">
              <Input
                {...register("password")}
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Input Your Password"
                className={cn(
                  "placeholder:text-gray-400 bg-gray-700",
                  (formErrors.password || state.errors?.password?.[0]) &&
                    "ring-2 ring-red-500 focus-visible:ring-red-500",
                )}
              />
              <Button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className=" bg-gray-700 hover:bg-gray-500"
              >
                {showPassword ? <Eye size={18} /> : <EyeClosed size={18} />}
              </Button>
            </div>
            {(formErrors.password?.message || state.errors?.password?.[0]) && (
              <span className="text-xs text-red-500">
                {formErrors.password?.message || state.errors?.password?.[0]}
              </span>
            )}
          </div>
          <Button
            className="mt-3 w-full border-2 bg-gray-700 hover:bg-gray-500"
            type="submit"
            disabled={isPending}
          >
            {isPending ? <Spinner /> : "Login"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col justify-center">
        <CardDescription className="text-white font-light">
          Not Have An Account?{" "}
          <Link
            href={"/auth/register"}
            className="underline hover:text-slate-200 transition-all"
          >
            Register
          </Link>
        </CardDescription>
        <CardDescription className="text-white font-light">
          Back To{" "}
          <Link
            href={"/"}
            className="underline hover:text-slate-200 transition-all"
          >
            Landing Page
          </Link>
        </CardDescription>
      </CardFooter>
    </Card>
  );
};

export default Login;
