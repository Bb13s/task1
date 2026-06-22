import { getAllAlbums } from '@/lib/db';
import AdminAlbumsClient from './AdminAlbumsClient';

export default function AdminAlbumsPage() {
  const albums = getAllAlbums();
  return <AdminAlbumsClient initialAlbums={albums} />;
}
