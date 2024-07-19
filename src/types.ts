export interface GreetOptions {
	logger?: (message: string) => void;
	message: string;
	times?: number;
}
