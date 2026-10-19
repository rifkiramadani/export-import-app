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
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="px-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-2 mb-3">
            <Label htmlFor="name">Name</Label>
            <Input {...register("name")} id="name" type="text" />
            {(formErrors.name?.message || state?.errors?.name?.[0]) && (
              <span className="text-xs text-red-500">
                {formErrors.name?.message || state.errors?.name?.[0]}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2 mb-3">
            <Label htmlFor="company_name">Company Name</Label>
            <Input
              {...register("company_name")}
              id="company_name"
              type="text"
            />
            {(formErrors.company_name?.message ||
              state?.errors?.company_name?.[0]) && (
              <span className="text-xs text-red-500">
                {formErrors.company_name?.message ||
                  state.errors?.company_name?.[0]}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2 mb-3">
            <Label htmlFor="country_id">Country</Label>
            <select
              {...register("country")}
              id="country_id"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            >
              <option value="">Choose Your Country</option>
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
          <div className="flex flex-col gap-2 mb-3">
            <Label htmlFor="email">Email</Label>
            <Input {...register("email")} id="email" type="email" />
            {(formErrors.email?.message || state?.errors?.email?.[0]) && (
              <span className="text-xs text-red-500">
                {formErrors.email?.message || state.errors?.email?.[0]}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2 mt-2 mb-3">
            <Label htmlFor="password">Password</Label>
            <div className="flex flex-row space-x-2">
              <Input
                {...register("password")}
                id="password"
                type={showPassword ? "text" : "password"}
              />
              <Button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <Eye size={18} /> : <EyeClosed size={18} />}
              </Button>
            </div>
            {(formErrors.password?.message || state?.errors?.password?.[0]) && (
              <span className="text-xs text-red-500">
                {formErrors.password?.message || state.errors?.password?.[0]}
              </span>
            )}
          </div>
          <Button className="mt-3 w-full" type="submit" disabled={isPending}>
            {isPending ? <Spinner /> : "Register"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <CardDescription>
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
