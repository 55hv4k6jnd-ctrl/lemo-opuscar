# web2video-vi: bài viết → video giải thích tiếng Việt

Đưa vào **link một bài viết** (hoặc file `.txt`), tool sẽ tạo một **video gốc tiếng Việt** sẵn sàng đăng YouTube:

1. Đọc nội dung chính của trang (bỏ quảng cáo, menu).
2. Claude viết **kịch bản mới bằng lời của kênh**: không dịch từng câu, không chép nguyên văn, giữ đúng sự thật, có hook ở đầu và lời mời đăng ký ở cuối.
3. Đọc lời thoại bằng giọng tiếng Việt (Microsoft edge-tts: giọng nữ HoaiMy hoặc nam NamMinh).
4. Dựng hình motion graphics bằng code: tiêu đề, từ khoá bật lên theo lời đọc, số liệu chạy, phụ đề, thanh tiến độ. **Không lấy ảnh hay video nào từ trang nguồn.**
5. Nhạc nền tự tạo (không vướng bản quyền) hoặc nhạc của bạn, tự hạ nhỏ khi có giọng đọc.

Kết quả nằm trong `output/<tên-bài>/`:

| File | Dùng để |
|---|---|
| `video.mp4` | video 1080p, âm lượng chuẩn YouTube (−14 LUFS) |
| `phu-de.vi.srt` | phụ đề tải lên YouTube |
| `thumbnail_1..3.jpg` | 3 mẫu thumbnail 1280×720 |
| `youtube.txt` | 3 tiêu đề gợi ý, mô tả, **chương (timestamps)**, nguồn tham khảo, tag |
| `script.json` | kịch bản, sửa được rồi dựng lại |

## Cài đặt

Cần Python 3.10+ và [ffmpeg](https://ffmpeg.org).

```bash
pip install -r requirements.txt
```

Để Claude tự viết kịch bản, cần API key ở https://console.anthropic.com:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

## Cách dùng

```bash
python web2video.py https://vi.wikipedia.org/wiki/Ong_mật
```

Tuỳ chọn hay dùng:

```bash
python web2video.py URL --minutes 6 --voice vi-VN-NamMinhNeural --rate +8%
```

- `--minutes`: độ dài mong muốn (mặc định 4 phút)
- `--voice`: `vi-VN-HoaiMyNeural` (nữ, mặc định) hoặc `vi-VN-NamMinhNeural` (nam)
- `--music nhac.mp3`: nhạc nền của bạn; `--music none` để tắt
- `--no-burn-subs`: không in phụ đề lên hình (vẫn xuất `.srt`)
- `--script-only`: chỉ viết `script.json` để bạn đọc và sửa trước

**Sửa kịch bản rồi dựng lại:**

```bash
python web2video.py --script output/<tên-bài>/script.json
```

**Không có API key?** Dùng claude.ai miễn phí:

```bash
python web2video.py URL --dump-prompt
```

Mở `output/<tên-bài>/prompt.md`, dán toàn bộ vào claude.ai, lưu khối JSON trả về thành `script.json` trong cùng thư mục, rồi chạy lệnh `--script` ở trên.

Font: tool dùng Inter nếu máy có; nếu không, đặt `W2V_FONT_BOLD`, `W2V_FONT_SEMIBOLD`, `W2V_FONT_REGULAR` trỏ tới font hỗ trợ tiếng Việt (ví dụ Be Vietnam Pro).

## Để kênh được bật kiếm tiền

- Chọn bài có thông tin hay, rồi **đọc lại `script.json`**: thêm góc nhìn, ví dụ, ý kiến của bạn. Kênh càng có dấu ấn riêng thì YouTube càng ít coi là "nội dung lặp lại".
- Luôn giữ dòng **Nguồn tham khảo** trong mô tả.
- Kiểm tra lại số liệu quan trọng trước khi đăng.
- Khi tải lên, bật mục *Altered or synthetic content* nếu YouTube hỏi (giọng đọc là giọng AI).
- Tool này dùng cho bài viết, không dùng để tải lại phim hay video của người khác.
