"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import {
  AlertIcon,
  CheckCircleIcon,
  RefreshIcon,
  XCircleIcon,
} from "@/components/ui/icons";
import {
  AksaraApiError,
  answerQuiz,
  fetchAksaraQuiz,
  type AksaraQuiz,
  type QuizAnswerData,
} from "@/lib/aksaraApi";
import { clearUserToken, readUserToken } from "@/lib/userApi";

export function QuizScreen({ aksaraId }: { aksaraId: number }) {
  const [quiz, setQuiz] = useState<AksaraQuiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [token, setToken] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<QuizAnswerData | null>(null);
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    let active = true;

    async function restoreSession(): Promise<void> {
      await Promise.resolve();

      if (active) {
        setToken(readUserToken());
      }
    }

    void restoreSession().finally(() => {
      if (active) {
        setSessionReady(true);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    fetchAksaraQuiz(aksaraId)
      .then((data) => {
        if (!active) {
          return;
        }
        setQuiz(data);
        setLoadError(null);
      })
      .catch((cause: unknown) => {
        if (!active) {
          return;
        }
        setLoadError(
          cause instanceof AksaraApiError
            ? cause.message
            : "Gagal memuat soal kuis. Coba lagi.",
        );
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [aksaraId, reloadKey]);

  const questions = quiz?.questions ?? [];
  const current = questions[index] ?? null;
  const isLast = questions.length > 0 && index === questions.length - 1;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!current || result || submitting) {
      return;
    }

    const trimmed = answer.trim();

    if (!trimmed) {
      setAnswerError("Tulis jawabanmu terlebih dahulu.");
      return;
    }

    if (!token) {
      setSessionExpired(true);
      return;
    }

    setSubmitting(true);
    setAnswerError(null);

    try {
      const data = await answerQuiz(current.id, trimmed, token);
      setResult(data);

      if (data.attempt.is_correct) {
        setCorrectCount((count) => count + 1);
      }
    } catch (cause) {
      if (cause instanceof AksaraApiError) {
        if (cause.status === 401) {
          clearUserToken();
          setToken(null);
          setSessionExpired(true);
          return;
        }

        setAnswerError(
          cause.errors.user_answer?.[0] ?? cause.message,
        );
      } else {
        setAnswerError("Terjadi kesalahan yang tidak terduga. Coba lagi.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleNext(): void {
    if (isLast) {
      setFinished(true);
      return;
    }

    setIndex((value) => value + 1);
    setAnswer("");
    setResult(null);
    setAnswerError(null);
  }

  function handleRestart(): void {
    setIndex(0);
    setAnswer("");
    setResult(null);
    setAnswerError(null);
    setCorrectCount(0);
    setFinished(false);
  }

  return (
    <main id="main" className="pb-20">
      <div className="shell pt-10 sm:pt-12 lg:pt-16">
        <Link
          href={`/aksara/${aksaraId}`}
          className="focus-ring inline-flex items-center gap-1.5 text-[11.5px] font-medium text-muted transition-colors hover:text-ink"
        >
          ← Kembali ke materi aksara
        </Link>

        <header className="mt-6 max-w-[680px]">
          <p className="eyebrow">Kuis Aksara</p>
          <h1 className="mt-2 font-serif text-[clamp(32px,4.2vw,48px)] leading-[1.08] font-normal tracking-[-0.02em] text-ink">
            {quiz?.aksara.name ?? "Kuis aksara"}
          </h1>
          {questions.length > 0 ? (
            <p className="mt-3 text-[12.5px] leading-[1.75] text-muted">
              {questions.length} soal. Jawaban diperiksa oleh server; hasil dan
              penjelasan muncul setelah kamu menjawab.
            </p>
          ) : null}
        </header>

        {loading ? (
          <div className="mt-8 space-y-4" aria-hidden="true">
            <div className="skeleton h-4 w-24 rounded" />
            <div className="skeleton h-40 w-full rounded-xl" />
            <div className="skeleton h-11 w-full rounded-lg" />
          </div>
        ) : null}

        {!loading && loadError ? (
          <div className="mt-8">
            <div
              role="alert"
              className="flex flex-wrap items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] leading-[1.7] text-red-800"
            >
              <AlertIcon className="h-4 w-4 shrink-0" />
              <span>{loadError}</span>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setReloadKey((key) => key + 1);
                }}
                className="focus-ring ml-auto inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-paper px-2.5 py-1 text-[11.5px] font-medium text-red-700 transition-colors hover:bg-red-100"
              >
                <RefreshIcon className="h-3 w-3" />
                Coba lagi
              </button>
            </div>
            <Link
              href="/kuis"
              className="focus-ring mt-4 inline-flex h-9 items-center rounded-md border border-line bg-paper px-3 text-[11.5px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white"
            >
              Pilih aksara lain
            </Link>
          </div>
        ) : null}

        {!loading && !loadError && questions.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-line bg-paper px-5 py-12 text-center">
            <p className="text-[13px] leading-[1.8] text-muted">
              Belum ada soal kuis untuk aksara ini. Materi aksaranya tetap bisa
              kamu baca.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link
                href={`/aksara/${aksaraId}`}
                className="focus-ring inline-flex h-9 items-center rounded-md bg-night px-3.5 text-[11.5px] font-medium text-[#f6f2e7] transition-colors hover:bg-ink"
              >
                Baca materi
              </Link>
              <Link
                href="/kuis"
                className="focus-ring inline-flex h-9 items-center rounded-md border border-line bg-paper px-3 text-[11.5px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white"
              >
                Pilih aksara lain
              </Link>
            </div>
          </div>
        ) : null}

        {!loading && !loadError && questions.length > 0 ? (
          <>
            {sessionExpired ? (
              <p
                role="alert"
                className="mt-6 flex items-start gap-2 rounded-lg border border-amber/50 bg-amber/10 px-4 py-3 text-[12.5px] leading-[1.7] text-ink"
              >
                <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Sesi akun tidak ditemukan atau sudah berakhir. Masuk lagi
                  untuk melanjutkan kuis.
                </span>
              </p>
            ) : null}

            {!sessionReady ? (
              <div
                aria-busy="true"
                aria-label="Memeriksa sesi"
                className="mt-8 h-28 rounded-xl skeleton"
              />
            ) : null}

            {sessionReady && !token ? (
              <section
                aria-labelledby="kuis-masuk-heading"
                className="mt-8 rounded-xl border border-line bg-paper p-5 sm:p-7"
              >
                <h2
                  id="kuis-masuk-heading"
                  className="font-serif text-[22px] leading-tight text-ink"
                >
                  Masuk untuk mengikuti kuis
                </h2>
                <p className="mt-2 max-w-[540px] text-[12.5px] leading-[1.8] text-muted">
                  Jawaban kuis diperiksa langsung oleh server dan memerlukan akun.
                  Masuk dengan akun yang sudah ada, atau buat akun baru lebih
                  dulu.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    href="/galeri#masuk"
                    className="focus-ring inline-flex h-10 items-center rounded-lg bg-night px-4 text-[12px] font-medium text-[#f6f2e7] transition-colors hover:bg-ink"
                  >
                    Masuk
                  </Link>
                  <Link
                    href="/registrasi"
                    className="focus-ring inline-flex h-10 items-center rounded-lg border border-line bg-paper px-4 text-[12px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white"
                  >
                    Buat akun
                  </Link>
                </div>
                <p className="mt-4 text-[11px] leading-[1.7] text-muted">
                  Setelah masuk, kembali ke halaman ini untuk memulai kuis.
                </p>
              </section>
            ) : null}

            {sessionReady && token && !finished ? (
              <section
                aria-labelledby="kuis-soal-heading"
                className="mt-8 rounded-xl border border-line bg-paper p-5 sm:p-7"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 id="kuis-soal-heading" className="eyebrow">
                    Soal {index + 1} dari {questions.length}
                  </h2>
                  <p className="text-[11px] text-muted">
                    Benar: {correctCount}
                  </p>
                </div>

                {current ? (
                  <>
                    <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
                      <div className="flex h-[126px] w-[126px] shrink-0 items-center justify-center rounded-xl border border-line bg-cream">
                        <span className="font-serif text-[clamp(40px,8vw,60px)] leading-none text-ink">
                          {current.displayed_character}
                        </span>
                      </div>
                      <p className="font-serif text-[clamp(20px,2.4vw,25px)] leading-[1.35] text-ink">
                        {current.question}
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-7 space-y-3">
                      <label
                        htmlFor="jawaban-kuis"
                        className="text-[12px] font-medium text-ink"
                      >
                        Jawabanmu
                      </label>
                      <input
                        id="jawaban-kuis"
                        type="text"
                        value={answer}
                        maxLength={255}
                        disabled={Boolean(result) || submitting}
                        onChange={(event) => {
                          setAnswer(event.target.value);
                          setAnswerError(null);
                        }}
                        autoComplete="off"
                        placeholder="Tulis jawaban di sini"
                        aria-invalid={Boolean(answerError)}
                        aria-describedby={
                          answerError ? "jawaban-kuis-error" : undefined
                        }
                        className={`focus-ring h-11 w-full rounded-lg border bg-paper px-3.5 text-[13.5px] text-ink outline-none transition-colors focus:border-ink/40 disabled:cursor-not-allowed disabled:bg-cream disabled:text-muted ${
                          answerError ? "border-red-300" : "border-line"
                        }`}
                      />
                      {answerError ? (
                        <p
                          id="jawaban-kuis-error"
                          className="text-[11.5px] text-red-700"
                        >
                          {answerError}
                        </p>
                      ) : null}
                      <p className="text-[11px] leading-[1.65] text-muted">
                        Pemeriksaan tidak peka huruf besar/kecil. Jawaban yang
                        dikirim akan dicatat oleh server.
                      </p>

                      {!result ? (
                        <button
                          type="submit"
                          disabled={submitting}
                          className="focus-ring inline-flex h-11 items-center justify-center rounded-lg bg-night px-5 text-[13px] font-medium text-[#f6f2e7] transition-colors hover:bg-ink disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {submitting ? "Memeriksa..." : "Periksa jawaban"}
                        </button>
                      ) : null}
                    </form>

                    {result ? (
                      <div
                        role="status"
                        aria-live="polite"
                        className={`mt-6 rounded-lg border px-4 py-4 ${
                          result.attempt.is_correct
                            ? "border-green-200 bg-green-50"
                            : "border-amber/50 bg-amber/10"
                        }`}
                      >
                        <p
                          className={`flex items-center gap-2 text-[13px] font-medium ${
                            result.attempt.is_correct
                              ? "text-green-900"
                              : "text-ink"
                          }`}
                        >
                          {result.attempt.is_correct ? (
                            <CheckCircleIcon className="h-4 w-4 shrink-0 text-green-700" />
                          ) : (
                            <XCircleIcon className="h-4 w-4 shrink-0 text-amber" />
                          )}
                          {result.attempt.is_correct
                            ? "Jawaban benar"
                            : "Jawaban belum tepat"}
                        </p>

                        <dl className="mt-3 space-y-1.5 text-[12.5px] leading-[1.7]">
                          <div className="flex flex-wrap gap-1.5">
                            <dt className="text-muted">Jawabanmu:</dt>
                            <dd className="font-medium text-ink">
                              {result.attempt.user_answer ?? "—"}
                            </dd>
                          </div>
                          {result.correct_answer ? (
                            <div className="flex flex-wrap gap-1.5">
                              <dt className="text-muted">Jawaban benar:</dt>
                              <dd className="font-medium text-ink">
                                {result.correct_answer}
                              </dd>
                            </div>
                          ) : null}
                        </dl>

                        {result.explanation ? (
                          <p className="mt-2 text-[12.5px] leading-[1.75] text-muted">
                            {result.explanation}
                          </p>
                        ) : null}

                        <button
                          type="button"
                          onClick={handleNext}
                          className="focus-ring mt-4 inline-flex h-10 items-center rounded-lg bg-night px-4 text-[12px] font-medium text-[#f6f2e7] transition-colors hover:bg-ink"
                        >
                          {isLast ? "Lihat hasil kuis" : "Soal berikutnya"}
                        </button>
                      </div>
                    ) : null}
                  </>
                ) : null}
              </section>
            ) : null}

            {sessionReady && token && finished ? (
              <section
                aria-labelledby="kuis-selesai-heading"
                className="mt-8 rounded-xl border border-line bg-paper p-6 sm:p-8"
              >
                <CheckCircleIcon className="h-8 w-8 text-green-700" />
                <h2
                  id="kuis-selesai-heading"
                  className="mt-3 font-serif text-[24px] leading-tight text-ink"
                >
                  Kuis selesai
                </h2>
                <p className="mt-2 text-[13px] leading-[1.8] text-muted">
                  Kamu menjawab benar{" "}
                  <span className="font-medium text-ink">{correctCount}</span>{" "}
                  dari {questions.length} soal pada sesi ini.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleRestart}
                    className="focus-ring inline-flex h-10 items-center gap-2 rounded-lg bg-night px-4 text-[12px] font-medium text-[#f6f2e7] transition-colors hover:bg-ink"
                  >
                    <RefreshIcon className="h-3.5 w-3.5" />
                    Ulangi kuis
                  </button>
                  <Link
                    href={`/aksara/${aksaraId}`}
                    className="focus-ring inline-flex h-10 items-center rounded-lg border border-line bg-paper px-4 text-[12px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white"
                  >
                    Baca materi lagi
                  </Link>
                  <Link
                    href="/kuis"
                    className="focus-ring inline-flex h-10 items-center rounded-lg border border-line bg-paper px-4 text-[12px] font-medium text-ink transition-colors hover:border-ink/40 hover:bg-white"
                  >
                    Pilih aksara lain
                  </Link>
                </div>

                <p className="mt-5 text-[11px] leading-[1.7] text-muted">
                  Halaman ini tidak menampilkan riwayat pengerjaan. Hasil di atas
                  hanya untuk sesi kuis yang baru saja diselesaikan.
                </p>
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </main>
  );
}
