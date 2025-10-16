declare module "*.scss";
declare module "*.sass";
declare module "*.css";
declare module "*.css?inline" {
  const content: string;
  export default content;
}
