"use client"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {Form, FormField} from "@/components/ui/form"

import { toast } from "sonner"



const authFormSchema = (type: FormType) => {
  
    return z.object({
        name: type === 'sign-up' ? z.string().min(3) : z.string()
        .optional() ,
        email: z.string().email(),
        password: z.string().min(3),
    })
}

const AuthForm = ({type} : {type: FormType}) => {
      const formSchema = authFormSchema(type);
const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  })
 
  // 2. Define a submit handler.
  function onSubmit(values: z.infer<typeof formSchema>) {
   try{
         if( type === 'sign-up'){
            console.log('SIGN UP', values);
         }
         else{
            console.log('SIGN IN', values);
         }
   }
   catch(error){
    console.log(error);
    toast.error(`There was an error : ${error}`)
   }
    console.log(values)
  }


 const isSignIn = type ==='sign-in';
   return (
    <div className="card-border lg:min-w-[566px]">
        <div className="flex flex-col gap-6 card py-14 px-10">
            <div className="flex flex-row gap-2 justify-center">
                
               <h2 className="text-primary-100">PitchX</h2>
            </div>
            <h3>Practice job interview with AI</h3>
        
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6 mt-4 form">
        {!isSignIn && (
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <div className="flex ">
                <label>Name</label>
                <input {...field} placeholder="Your name" />
              </div>
            )}
          />
        )}
        <p>Email</p>
        <p>Password</p>
        <Button className="btn" type="submit">{isSignIn ? 'Sign In' : 'Create an account'}</Button>
      </form>
    </Form>
    <p className="text-center">
        {isSignIn ? 'No account yet?' : 'Have an account already ?'}
        <Link href = {!isSignIn ? '/sign-in': '/sign-up'} className = "font-bold text-user-primary ml-1">
        {!isSignIn ? "Sign in" : "Sign Up"}
        </Link>
    </p>
    </div>
    </div>
  )
};

export default AuthForm;