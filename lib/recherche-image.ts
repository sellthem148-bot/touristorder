/** Une recherche d'images sur le nom de l'article (en hébreu quand on l'a : c'est ce qui trouve l'emballage vendu en Israël). */
export const rechercheDImage = (nom: string, hebreu: string) => `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(hebreu.trim() || nom)}`;
