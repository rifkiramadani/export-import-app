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
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="px-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              {...register("email")}
              id="email"
              type="email"
              placeholder="Input your email..."
            />
            {(formErrors.email?.message || state.errors?.email?.[0]) && (
              <span className="text-xs text-red-500">
                {formErrors.email?.message || state.errors?.email?.[0]}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <Label htmlFor="password">Password</Label>
            <div className="flex flex-row space-x-2">
              <Input
                {...register("password")}
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Input your password..."
              />
              <Button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
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
          <Button className="mt-3 w-full" type="submit" disabled={isPending}>
            {isPending ? <Spinner /> : "Login"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <CardDescription>
          Not Have An Account?{" "}
          <Link
            href={"/auth/register"}
            className="underline hover:text-slate-700 transition-all"
          >
            Register
          </Link>
        </CardDescription>
      </CardFooter>
    </Card>
  );
};

export default Login;
