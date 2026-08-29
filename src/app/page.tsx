import { HomePage } from "./components/home-page";
import { getPublicData } from "./lib/public-data";

export default async function Page() { return <HomePage data={await getPublicData()}/>; }
