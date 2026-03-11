import http.server
import socketserver
import urllib.request
import urllib.error

PORT = 8080

class ProxyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

    def do_GET(self):
        if self.path.startswith('/api/reed/'):
            # Proxy request to Reed API
            reed_path = self.path.replace('/api/reed/', 'https://www.reed.co.uk/api/1.0/')
            
            req = urllib.request.Request(reed_path)
            # We need the authorization header
            auth_header = self.headers.get('Authorization')
            if auth_header:
                req.add_header('Authorization', auth_header)
                
            try:
                with urllib.request.urlopen(req) as response:
                    self.send_response(response.status)
                    self.send_header('Access-Control-Allow-Origin', '*')
                    for header, value in response.getheaders():
                        if header.lower() not in ['transfer-encoding', 'connection']:
                            self.send_header(header, value)
                    super().end_headers()
                    self.wfile.write(response.read())
            except urllib.error.HTTPError as e:
                self.send_response(e.code)
                self.send_header('Access-Control-Allow-Origin', '*')
                super().end_headers()
                self.wfile.write(e.read())
            except Exception as e:
                self.send_response(500)
                self.send_header('Access-Control-Allow-Origin', '*')
                super().end_headers()
                self.wfile.write(str(e).encode('utf-8'))
        else:
            super().do_GET()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS, POST')
        self.send_header('Access-Control-Allow-Headers', 'Authorization, Content-Type, x-api-key, anthropic-version, anthropic-dangerous-direct-browser-access')
        super().end_headers()

print(f"Starting proxy server on port {PORT}...")
with socketserver.TCPServer(("", PORT), ProxyHTTPRequestHandler) as httpd:
    httpd.serve_forever()
