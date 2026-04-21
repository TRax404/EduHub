export interface WelcomeEmailJobData {
    jobId: string;
    email: string;
    name: string;
}

export enum OtpType {
    REGISTER = 'register',
    FORGOT_PASSWORD = 'forgot_password',
    RESET_PASSWORD = 'reset_password',
}

export interface OtpEmailJobData {
    jobId: string;
    email: string;
    otp: string;
    type: OtpType;
}

export type WelcomeEmailInput = Omit<WelcomeEmailJobData, 'jobId'>;
export type OtpEmailInput = Omit<OtpEmailJobData, 'jobId'>;
