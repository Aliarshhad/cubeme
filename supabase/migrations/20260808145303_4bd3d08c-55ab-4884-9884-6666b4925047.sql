CREATE POLICY "own avatar files" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "own receipt files" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);
