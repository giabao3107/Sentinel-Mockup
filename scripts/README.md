# Scripts

Thư mục này chứa các script setup và utility cho Sentinel Enhanced.

## Files

- `setup.py` - Script setup tự động cho toàn bộ hệ thống
- `import_more_data.py` - Script import dữ liệu mẫu vào Neo4j

## Cách sử dụng

### Setup hệ thống
```bash
# Chạy setup tự động
python scripts/setup.py
```

### Import dữ liệu mẫu
```bash
# Import thêm dữ liệu test
python scripts/import_more_data.py
```

## Chức năng

### setup.py
- Kiểm tra Python version
- Cài đặt dependencies
- Setup Neo4j container
- Tạo file cấu hình .env

### import_more_data.py
- Thêm địa chỉ mẫu vào database
- Tạo các transaction relationship
- Cập nhật thống kê database 