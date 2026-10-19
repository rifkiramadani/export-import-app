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
import { startTransition, useActionState, useEffect, useState } from "react";
import { signUp } from "../../action";
import { Country } from "@/types/country";
import { useForm } from "react-hook-form";
import { RegisterForm, registerSchema } from "@/lib/validations/auth";
import {
  INITIAL_REGISTER_FORM,
  INITIAL_STATE_REGISTER,
} from "@/constants/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import Link from "next/link";
import { Eye, EyeClosed } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "cn";

interface IRegisterPage {
  title: string;
  description: string;
  countries: Country[];
}

const Register = ({ title, description, countries }: IRegisterPage) => {
  const [showPassword, setShowPassword] = useState(false);

  // 1 VALIDATION
  const {
    register,
    handleSubmit,
    formState: { errors: formErrors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: INITIAL_REGISTER_FORM,
  });

  // 4 ACTION
  const [state, formAction, isPending] = useActionState(
    signUp,
    INITIAL_STATE_REGISTER,
  );

  // 2 SUBMIT
  const onSubmit = (data: RegisterForm) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });
    // 3 TRANSITION
    startTransition(() => {
      formAction(formData);
    });
  };

  // toaster error
  useEffect(() => {
    if (state?.status === "error" && state.errors?._form?.[0]) {
      toast.error("Registration Failed", {
        description: state.errors._form[0],
      });
    }
  }, [state]);

  return (
    <Card className="bg-linear-to-br from-secondary to-primary text-white shadow-2xl shadow-secondary">
      <CardHeader className="space-x-4">
        <CardTitle className="font-thin text-3xl">{title}</CardTitle>
        <CardDescription className="font-light text-white">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="px-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-row gap-2">
            <div className="flex flex-col gap-2 mb-3">
              <Label htmlFor="name" className="font-light">
                Name
              </Label>
              <Input
                {...register("name")}
                id="name"
                type="text"
                placeholder="Input Your Name"
                className={cn(
                  "bg-gray-700 placeholder:text-gray-400",
                  (formErrors.name || state.errors?.name?.[0]) &&
                    "ring-2 ring-red-500 focus-visible:ring-red-500",
                )}
              />
              {(formErrors.name?.message || state?.errors?.name?.[0]) && (
                <span className="text-xs text-red-500">
                  {formErrors.name?.message || state.errors?.name?.[0]}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2 mb-3">
              <Label htmlFor="company_name" className="font-light">
                Company Name
              </Label>
              <Input
                {...register("company_name")}
                id="company_name"
                type="text"
                placeholder="Input Your Company Name"
                className={cn(
                  "bg-gray-700 placeholder:text-gray-400",
                  (formErrors.name || state.errors?.name?.[0]) &&
                    "ring-2 ring-red-500 focus-visible:ring-red-500",
                )}
              />
              {(formErrors.company_name?.message ||
                state?.errors?.company_name?.[0]) && (
                <span className="text-xs text-red-500">
                  {formErrors.company_name?.message ||
                    state.errors?.company_name?.[0]}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-row gap-2">
            <div className="flex flex-col gap-2 mb-3">
              <Label htmlFor="email" className="font-light">
                Email
              </Label>
              <Input
                {...register("email")}
                id="email"
                type="email"
                placeholder="Input Your Email"
                className={cn(
                  "bg-gray-700 placeholder:text-gray-400",
                  (formErrors.email || state.errors?.email?.[0]) &&
                    "ring-2 ring-red-500 focus-visible:ring-red-500",
                )}
              />
              {(formErrors.email?.message || state?.errors?.email?.[0]) && (
                <span className="text-xs text-red-500">
                  {formErrors.email?.message || state.errors?.email?.[0]}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2 w-[55%]">
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
                    "bg-gray-700 placeholder:text-gray-400",
                    (formErrors.password || state.errors?.password?.[0]) &&
                      "ring-2 ring-red-500 focus-visible:ring-red-500",
                  )}
                />
                <Button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="bg-gray-700 hover:bg-gray-500"
                >
                  {showPassword ? <Eye size={18} /> : <EyeClosed size={18} />}
                </Button>
              </div>
              {(formErrors.password?.message ||
                state?.errors?.password?.[0]) && (
                <span className="text-xs text-red-500">
                  {formErrors.password?.message || state.errors?.password?.[0]}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 mb-3 relative">
            <Label htmlFor="country_id" className="font-light">
              Country
            </Label>
            <select
              {...register("country")}
              id="country_id"
              className={cn(
                "bg-gray-700 flex h-9 w-full rounded-md border border-input appearance-none px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                (formErrors.country || state.errors?.country?.[0]) &&
                  "ring-2 ring-red-500 focus-visible:ring-red-500",
              )}
            >
              <option value="" className="text-gray-400">
                Choose Your Country
              </option>
              {countries.map((country) => (
                <option value={country.id} key={country.id}>
                  {country.name} ({country.code})
                </option>
              ))}
            </select>
            {(formErrors.country?.message || state?.errors?.country?.[0]) && (
              <span className="text-xs text-red-500">
                {formErrors.country?.message || state.errors?.country?.[0]}
              </span>
            )}
          </div>
          <Button
            className="mt-3 w-full bg-gray-700 hover:bg-gray-500"
            type="submit"
            disabled={isPending}
          >
            {isPending ? <Spinner /> : "Register"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <CardDescription className="text-light text-white">
          Already Have An Account?{" "}
          <Link
            href={"/auth/login"}
            className="underline hover:text-slate-700 transition-all"
          >
            Login
          </Link>
        </CardDescription>
      </CardFooter>
    </Card>
  );
};

export default Register;
