export const buildSuccess = (data: any) => {
	return {
		content: [
			{
				type: "text" as const,
				text: typeof data === "string" ? data : JSON.stringify(data, null, 2),
			},
		],
		isError: false,
	};
};

export const buildError = (message: string, errorDetails?: any) => {
	const errorObj = {
		error: message,
		...(errorDetails && { details: errorDetails }),
	};
	return {
		content: [
			{
				type: "text" as const,
				text: JSON.stringify(errorObj, null, 2),
			},
		],
		isError: true,
	};
};
