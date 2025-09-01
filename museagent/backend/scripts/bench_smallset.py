import time


def main():
    start = time.time()
    # Placeholder benchmark
    time.sleep(0.05)
    dur = time.time() - start
    print({"median_s_per_clip": dur})


if __name__ == "__main__":
    main()


